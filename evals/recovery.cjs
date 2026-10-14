const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText, filename);
};
const { queryGemini } = require('../src/lib/gemini.ts');
const { convertGoldToINRPerGram, formatMarketData, SYMBOLS } = require('../src/lib/brief-generator.ts');
const originalFetch = global.fetch;
after(() => { global.fetch = originalFetch; });
const answer = (parts, finishReason = 'STOP') => Response.json({ candidates: [{ content: { parts }, finishReason }] });

test('falls back when the primary Gemini model is unavailable', async () => {
  const urls = [];
  const requests = [];
  global.fetch = async (url, options) => {
    urls.push(String(url));
    requests.push(options);
    return urls.length === 1 ? Response.json({}, { status: 503 }) : answer([{ text: 'Available answer' }]);
  };
  assert.equal(await queryGemini('Hello', 'test-key'), 'Available answer');
  assert.ok(urls[0].includes('gemini-3.8-flash'));
  assert.ok(urls[1].includes('gemini-3-flash-preview'));
  for (const [index, options] of requests.entries()) {
    assert.equal(options.headers['x-goog-api-key'], 'test-key');
    assert.ok(!urls[index].includes('test-key'));
    assert.equal(JSON.parse(options.body).generationConfig.thinkingConfig.thinkingLevel,
      index === 0 ? 'low' : 'minimal');
  }
});

test('does not expose provider authentication errors or retry invalid keys', async () => {
  let calls = 0;
  global.fetch = async () => { calls++; return Response.json({ error: { message: 'private credential detail' } }, { status: 401 }); };
  await assert.rejects(queryGemini('Hello', 'test-key'), /authentication failed/i);
  assert.equal(calls, 1);
});

test('joins visible text parts and excludes internal thoughts', async () => {
  global.fetch = async () => answer([{ text: 'Hidden thought', thought: true }, { text: 'First ' }, { text: 'second' }]);
  assert.equal(await queryGemini('Hello', 'test-key'), 'First second');
});

test('does not deliver truncated analysis as a complete answer', async () => {
  global.fetch = async () => answer([{ text: 'Incomplete sentence' }], 'MAX_TOKENS');
  await assert.rejects(queryGemini('Hello', 'test-key'), /incomplete/i);
});

test('uses the latest previous session close rather than the seven-day starting price', async () => {
  let prompt;
  global.fetch = async (url, options) => {
    if (String(url).includes('yahoo')) return Response.json({ chart: { result: [{ meta: {
      regularMarketPrice: 110, chartPreviousClose: 90, previousClose: 100, currency: 'USD', shortName: 'Apple'
    }, indicators: { quote: [{ close: [90, 100, 110] }] } }] } });
    prompt = JSON.parse(options.body).contents[0].parts[0].text;
    return answer([{ text: 'Analysis' }]);
  };
  await queryGemini('AAPL', 'test-key');
  assert.ok(prompt.includes('+10.00 (+10.00%)'));
});

test('gold conversion uses the supplied current USD/INR rate', () => {
  assert.equal(convertGoldToINRPerGram(3110.35, 90), 9000);
});

test('Nifty prices are labelled in rupees', () => {
  const formatted = formatMarketData({ symbol: SYMBOLS.NIFTY, name: 'Nifty', price: 25000,
    change: null, changePercent: null, marketTime: null, status: 'Closing Price', sparkline: '' });
  assert.ok(formatted.includes('₹25000.00'));
});
