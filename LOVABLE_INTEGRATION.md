# Lovable Platform Integration

This document describes the Lovable platform integration and how to use it effectively.

## Overview

The project includes comprehensive Lovable.dev integration to ensure seamless development and deployment on the Lovable platform. This includes:

- **Component Tagging**: Automatic component identification for Lovable's AI
- **Mock Data Fallback**: Graceful degradation when backend is unavailable
- **Environment Detection**: Automatic detection of Lovable environment
- **Optimized Build**: Build configuration optimized for Lovable

## Features

### 1. Environment Detection

The integration automatically detects when running on Lovable:

```typescript
import { isLovableEnvironment } from "@/lib/utils/lovable"

if (isLovableEnvironment()) {
  // Lovable-specific logic
}
```

### 2. Mock Data Fallback

When the backend is unavailable (common on Lovable), the app automatically falls back to realistic mock data:

```typescript
import { shouldUseMockData } from "@/lib/utils/lovable"

if (shouldUseMockData()) {
  // Use mock data
}
```

### 3. Component Tagging

Components are automatically tagged in development mode for Lovable's AI to understand the codebase better. This is enabled by default in development.

## Configuration

### Environment Variables

- `VITE_LOVABLE` or `NEXT_PUBLIC_LOVABLE`: Explicitly enable Lovable mode
- `VITE_USE_MOCK_DATA` or `NEXT_PUBLIC_USE_MOCK_DATA`: Control mock data usage (`true`/`false`)
- `VITE_LOVABLE_TAGGER`: Control component tagging (`true`/`false`, default: `true` in dev)
- `VITE_API_URL` or `NEXT_PUBLIC_API_URL`: Override API base URL

### Configuration File

The `.lovable.config.json` file contains platform-specific settings:

```json
{
  "name": "Cross-Chain Arbitrage Bot",
  "features": {
    "componentTagging": true,
    "mockDataFallback": true,
    "autoEnvironmentDetection": true
  }
}
```

## API Client Behavior

All API clients (`lib/api.ts`, `lib/dapp/api.ts`, `hooks/useApiData.ts`) automatically:

1. **Detect Lovable environment**: Skip network requests when on Lovable with mock data enabled
2. **Fallback gracefully**: Use mock data when backend is unavailable
3. **Log appropriately**: Console logs indicate when mock data is being used

### Example

```typescript
// On Lovable, this automatically uses mock data
const status = await apiClient.getBotStatus()
// Console: [Lovable] Using mock data for: /bot/status
```

## Mock Data

Mock data is generated with realistic patterns:

- **Dynamic values**: Prices, balances, and metrics vary slightly on each request
- **Realistic timestamps**: Properly formatted ISO timestamps
- **Complete data structures**: All required fields are populated
- **Status indicators**: Mock mode is clearly indicated in responses

## Development

### Local Development

When developing locally:

1. Backend available: Real API calls are made
2. Backend unavailable: Automatic fallback to mock data
3. Set `VITE_USE_MOCK_DATA=false` to force real API calls (will fail if backend is down)

### Lovable Development

On Lovable platform:

1. Mock data is used by default
2. No backend connection required
3. All features work with realistic mock data
4. Component tagging is enabled for better AI assistance

## Build Configuration

The Vite config is optimized for Lovable:

- **Component tagging**: Enabled in development
- **Source maps**: Enabled for debugging
- **Chunk optimization**: Vendor and UI libraries are split for better performance

## Troubleshooting

### Mock data not working

1. Check `VITE_USE_MOCK_DATA` is not set to `false`
2. Verify Lovable environment detection: `isLovableEnvironment()` should return `true`
3. Check console logs for `[Lovable]` messages

### Component tagging not working

1. Ensure you're in development mode
2. Check `VITE_LOVABLE_TAGGER` is not set to `false`
3. Verify `lovable-tagger` is installed: `npm list lovable-tagger`

### API calls failing

1. On Lovable: This is expected - mock data should be used instead
2. Locally: Check backend is running and `VITE_API_URL` is correct
3. Check network tab for actual requests being made

## Best Practices

1. **Always use the utilities**: Use `getApiBaseUrl()`, `shouldUseMockData()`, etc. instead of direct env var access
2. **Test with mock data**: Ensure your components work with mock data
3. **Clear logging**: Use `[Lovable]` prefix for Lovable-specific logs
4. **Graceful degradation**: Always handle cases where backend is unavailable

## Integration Points

- `lib/utils/lovable.ts`: Core utilities
- `lib/api.ts`: Main API client
- `lib/dapp/api.ts`: DApp API client
- `hooks/useApiData.ts`: React hook for API data
- `vite.config.ts`: Build configuration
- `.lovable.config.json`: Platform configuration

## Support

For issues or questions about Lovable integration:

1. Check this documentation
2. Review console logs for `[Lovable]` messages
3. Verify environment variables are set correctly
4. Check `.lovable.config.json` configuration
