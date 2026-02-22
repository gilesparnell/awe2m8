# API Debug Tooling

Use this script to test GHL and Assistable API calls and print request/response details to the console.

## Command

```bash
npm run debug:api -- --provider <ghl|assistable|custom> [options]
```

## Common examples

GHL request:

```bash
npm run debug:api -- \
  --provider ghl \
  --endpoint /contacts/ \
  --method GET
```

Assistable request with JSON payload file:

```bash
npm run debug:api -- \
  --provider assistable \
  --endpoint /v1/calls \
  --method POST \
  --body-file ./tmp/assistable-call.json
```

Custom URL:

```bash
npm run debug:api -- \
  --url https://example.com/webhook \
  --method POST \
  --header "x-api-key: your_key" \
  --body '{"hello":"world"}'
```

## Options

- `--provider`: `ghl`, `assistable`, or `custom`
- `--url`: full URL override
- `--endpoint`: path appended to provider base URL
- `--method`: HTTP method (default `GET`)
- `--header`: repeatable custom header (`Header: value`)
- `--body`: inline JSON or plain text
- `--body-file`: request body from file
- `--timeout-ms`: request timeout (default `30000`)
- `--show-secrets`: print unmasked secret headers

## Environment variables used

GHL preset:

- `GHL_BASE_URL` (default `https://services.leadconnectorhq.com`)
- `GHL_API_KEY` or `GHL_ACCESS_TOKEN` (used as `Authorization: Bearer ...`)
- `GHL_API_VERSION` (sent as `Version` header if set)

Assistable preset:

- `ASSISTABLE_BASE_URL` (default `https://api.assistable.ai`)
- `ASSISTABLE_API_KEY` or `ASSISTABLE_ACCESS_TOKEN` (used as `Authorization: Bearer ...`)
