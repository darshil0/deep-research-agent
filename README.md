# Deep Research Agent

An autonomous, iterative research agent built with TypeScript/React, powered by Google's Gemini 2.0 Flash model. This production-ready platform performs deep web research, extracts evidence, and synthesizes comprehensive reports with citations.

**Current Version**: 1.8.0 | **Status**: Production Ready ✅ | **Last Updated**: May 31, 2026

---

## 🚀 Features

- **Multi-Provider Search**: Choose between Tavily, Google Search Tool (Grounding), or Hybrid mode for maximum research coverage
- **Secure API Authentication**: Protected by an `AUTH_TOKEN` system with Express middleware, secure WebSocket handshakes, and token lifecycle management
- **Native Multi-language Support**: Automatically detects research language and generates reports in any user-specified language (English, Spanish, Chinese, French, German, Japanese, and more)
- **Professional PDF Export**: One-click "Save as PDF" with optimized layout and typography for professional distribution
- **Iterative Research with Fallback**: Decomposes complex queries into sub-tasks, recovers gracefully from provider failures, and improves understanding based on search findings
- **Research History Sidebar**: Chronologically grouped sidebar ("Today", "Yesterday", "Earlier") to revisit, search, and manage past reports
- **Session Persistence**: Automatic recovery of current research states from `localStorage` (client-side) and optional server-side session storage
- **Intelligent Caching**: High-performance file-based content cache with configurable TTL, automatic rotation, stale-data handling, and cache invalidation strategies
- **Real-time Progress**: Live updates via WebSocket with automatic reconnection, exponential backoff, and detailed activity logs
- **Unit Tested**: Core agent logic verified by a robust Vitest suite with >85% code coverage
- **Production Hardened**: Rate limiting, quota management, comprehensive error handling, and security best practices

---

## 🏗️ Architecture

### AI & Agent Layer (TypeScript)
- **ResearchOrchestrator**: Manages the high-level research lifecycle (Plan → Research → Synthesize → Validate)
- **Router**: Dispatches tasks to specific agent modules, handles state synchronization, and manages error recovery
- **Planner**: Decomposes research topic into logical, actionable sub-queries using Gemini 1.5/2.0; includes cost estimation
- **Searcher**: Provider-agnostic search interface with fallback logic; swaps between Tavily, Google, or Hybrid backends
- **Analyzer**: Processes raw source content to extract relevant evidence, claims, and citations with confidence scoring
- **Synthesizer**: Compiles findings into structured Markdown report with mandatory inline citations and source attribution
- **ValidationEngine**: Verifies factual consistency, detects conflicting claims, and flags sources requiring secondary verification

### Backend (Node.js/Express)
- **Server**: Handles API endpoints, authentication middleware, WebSocket connections, and request rate limiting
- **ContentCache**: Robust caching layer storing fetched HTML content with TTL management and automatic cleanup
- **ErrorHandler**: Centralized error handling with circuit breaker pattern for failed providers
- **SessionManager**: Manages client sessions, token lifecycle, and automatic cleanup of orphaned sessions

### Frontend (React + Vite)
- **Modern UI**: Premium, dark-themed interface optimized for speed and accessibility
- **Auth Modal**: Integrated task-level security with token input/validation for private or team research sessions
- **Progress Dashboard**: Real-time visual feedback with activity logs, estimated time remaining, and cost tracking
- **Responsive Design**: Fully optimized for mobile (320px+), tablet, and desktop workflows

---

## 🛠️ Setup

### Prerequisites
- Node.js 18+ (tested on 18.16.0 and 20.x)
- npm 8+ or yarn 3+
- **Google AI Studio API Key** (Required for Gemini; free tier available)
- **Tavily API Key** (Optional; enables advanced search; free tier: 1000 searches/month)
- Modern browser with WebSocket support (Chrome 43+, Firefox 11+, Safari 8+, Edge 12+)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/deep-research-agent.git
   cd deep-research-agent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the project root. Use `.env.example` as a template:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in `.env` (see [Environment Variables](#environment-variables) section below)

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Access the application at `http://localhost:3000`

### `.env.example` Template

```bash
# ============================================================
# REQUIRED: Google Gemini API
# ============================================================
GEMINI_API_KEY=your_gemini_api_key_here
AGENT_MODEL=gemini-2.0-flash-exp

# ============================================================
# OPTIONAL: Search Provider Configuration
# ============================================================
# Leave TAVILY_API_KEY blank to disable Tavily searches
TAVILY_API_KEY=your_tavily_api_key_here
SEARCH_MODE=hybrid              # Options: tavily, google, hybrid

# ============================================================
# SECURITY: API & WebSocket Authentication
# ============================================================
# If AUTH_TOKEN is set, all API requests and WebSocket connections
# require an Authorization header or token query parameter
# Leave blank to disable authentication (development only)
AUTH_TOKEN=your_secure_session_token_here

# ============================================================
# TOKEN LIFECYCLE & EXPIRATION (seconds)
# ============================================================
TOKEN_EXPIRY_SECONDS=3600       # Session token expiration (default: 1 hour)
TOKEN_REFRESH_THRESHOLD=300     # Refresh token 5 minutes before expiry

# ============================================================
# CACHING & STORAGE
# ============================================================
CACHE_TTL=86400                 # Content cache duration in seconds (default: 24 hours)
RESULTS_MAX_AGE_DAYS=7          # Purge research results older than N days
CACHE_DIR=./cache               # Directory for file-based cache
SESSIONS_DIR=./sessions         # Directory for server-side session storage

# ============================================================
# RATE LIMITING & QUOTAS
# ============================================================
RATE_LIMIT_REQUESTS=100         # Max requests per window
RATE_LIMIT_WINDOW_MS=60000      # Rate limit window in milliseconds (default: 1 minute)
MAX_CONCURRENT_SEARCHES=3       # Max parallel search tasks
MAX_RESEARCH_DEPTH=5            # Maximum sub-queries per research task
API_QUOTA_DAILY_LIMIT=10000     # Daily API call budget (0 = unlimited)

# ============================================================
# WEBSOCKET & RECONNECTION
# ============================================================
WS_RECONNECT_MAX_ATTEMPTS=5     # Max reconnection attempts
WS_RECONNECT_INITIAL_DELAY=1000 # Initial reconnection delay (milliseconds)
WS_PING_INTERVAL=30000          # Keep-alive ping interval (30 seconds)

# ============================================================
# LOGGING & DEBUG
# ============================================================
LOG_LEVEL=info                  # Options: debug, info, warn, error
ENABLE_PERFORMANCE_LOGGING=true # Log research execution timing
ENABLE_COST_TRACKING=true       # Track API costs per research task

# ============================================================
# PRODUCTION DEPLOYMENT
# ============================================================
NODE_ENV=development            # Options: development, production, staging
PORT=3000
HOST=localhost
SESSION_STORE=memory            # Options: memory, redis, file (see Deployment section)
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Default | Description | Security Notes |
|----------|----------|---------|-------------|-----------------|
| `GEMINI_API_KEY` | **Yes** | — | Google Gemini API key from [AI Studio](https://aistudio.google.com) | Never commit to git; rotate quarterly |
| `AGENT_MODEL` | No | `gemini-2.0-flash-exp` | AI model for planning/synthesis (alternatives: `gemini-1.5-pro`, `gemini-1.5-flash`) | Supported models listed in [API Reference](#api-reference) |
| `TAVILY_API_KEY` | No | — | Tavily Search API key; leave blank to disable Tavily | Optional; enable Hybrid search coverage |
| `SEARCH_MODE` | No | `hybrid` | Search provider mode: `tavily`, `google`, or `hybrid` | See [Search Provider Behavior](#search-provider-behavior) |
| `AUTH_TOKEN` | No | — | Token required for API and WebSocket access; leave blank to disable (dev only) | **CRITICAL**: Use strong random token (32+ chars); rotate every 90 days |
| `TOKEN_EXPIRY_SECONDS` | No | `3600` | Session token lifetime (seconds) | Range: 300–86400 (5 min – 24 hours) |
| `TOKEN_REFRESH_THRESHOLD` | No | `300` | Refresh token N seconds before expiry | Recommended: 5 minutes |
| `CACHE_TTL` | No | `86400` | Content cache duration (seconds) | Range: 300–604800 (5 min – 7 days) |
| `RESULTS_MAX_AGE_DAYS` | No | `7` | Purge result files older than N days | Range: 1–30; impacts storage usage |
| `CACHE_DIR` | No | `./cache` | File-based cache directory path | Must be writable; auto-created if missing |
| `RATE_LIMIT_REQUESTS` | No | `100` | Max API requests per rate limit window | Adjust based on expected concurrency |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Rate limit evaluation window (ms) | Standard: 60000 (1 minute) |
| `MAX_CONCURRENT_SEARCHES` | No | `3` | Maximum parallel search operations | Range: 1–10; impacts latency & cost |
| `MAX_RESEARCH_DEPTH` | No | `5` | Maximum decomposed sub-queries per task | Range: 1–10; controls research scope |
| `API_QUOTA_DAILY_LIMIT` | No | `10000` | Daily API call budget (0 = unlimited) | Track costs in production; set alert if approaching limit |
| `WS_RECONNECT_MAX_ATTEMPTS` | No | `5` | Max WebSocket reconnection attempts | After N failures, user must manually reconnect |
| `WS_RECONNECT_INITIAL_DELAY` | No | `1000` | Initial reconnection delay (ms) | Uses exponential backoff: delay × 1.5 per attempt |
| `WS_PING_INTERVAL` | No | `30000` | Keep-alive ping interval (ms) | Prevents connection timeout by idle proxies |
| `LOG_LEVEL` | No | `info` | Logging verbosity: `debug`, `info`, `warn`, `error` | Use `debug` for development only |
| `NODE_ENV` | No | `development` | Execution environment | Production must use `production` |
| `PORT` | No | `3000` | Server listening port | Use `3000–9999` for development |
| `SESSION_STORE` | No | `memory` | Session backend: `memory`, `redis`, or `file` | Use `redis` in production for multi-instance deployments |

### Search Provider Behavior

#### **Tavily Mode**
- **Pros**: High-quality results, built-in source extraction, fast turnaround
- **Cons**: Requires API key, rate-limited (varies by tier), costs $0.005–$0.01 per search
- **Best For**: Production environments, high-accuracy requirements, cost-conscious operations (free tier: 1000/month)

#### **Google Mode**
- **Pros**: No additional API key required (uses Gemini grounding), unlimited searches, comprehensive coverage
- **Cons**: Slower (requires multiple passes), less structured data extraction, subject to Google Search terms of service
- **Best For**: Development, open-ended research, scenarios where cost is a concern

#### **Hybrid Mode (Recommended)**
- **How It Works**:
  1. Initiates parallel searches with both Tavily and Google
  2. Merges results by relevance score and URL deduplication
  3. If one provider fails or times out (10s timeout), uses the other as fallback
  4. Flags conflicting claims with confidence scores and evidence chains
- **Conflict Resolution**: When providers return contradictory information:
  - Prioritizes sources with higher citation counts
  - Tags claims as "disputed" and includes both perspectives
  - Logs conflict for post-research review
- **Cost**: ~$0.005 per search (Tavily component); zero cost if Tavily unavailable
- **Best For**: Critical research, fact-checking, comprehensive analysis

---

## 📝 API Reference

### Authentication

If `AUTH_TOKEN` is set in `.env`, all requests require an `Authorization` header:

```http
GET /api/research/history HTTP/1.1
Authorization: Bearer YOUR_AUTH_TOKEN_HERE
```

**Token Validation Rules**:
- Tokens expire after `TOKEN_EXPIRY_SECONDS` (default: 1 hour)
- Expired tokens return `401 Unauthorized`
- Clients must refresh tokens when within `TOKEN_REFRESH_THRESHOLD` (default: 5 min before expiry)
- Invalid/missing tokens return `403 Forbidden`

### Endpoints

#### **POST** `/api/research/start`

Initializes a new research task.

**Request**:
```json
{
  "query": "Latest developments in quantum computing 2025",
  "language": "en",
  "searchMode": "hybrid",
  "maxDepth": 3,
  "outputFormat": "markdown"
}
```

**Request Schema**:
| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| `query` | string | Yes | — | Length: 10–500 chars; non-empty |
| `language` | string | No | `en` | ISO 639-1 code (e.g., `en`, `es`, `fr`, `de`, `ja`, `zh`) |
| `searchMode` | string | No | from env | One of: `tavily`, `google`, `hybrid` |
| `maxDepth` | number | No | 3 | Range: 1–5; controls research scope |
| `outputFormat` | string | No | `markdown` | One of: `markdown`, `json`, `html` |

**Response** (201 Created):
```json
{
  "taskId": "task_abc123xyz789",
  "status": "initialized",
  "query": "Latest developments in quantum computing 2025",
  "createdAt": "2026-05-31T14:23:45.123Z",
  "estimatedCompletion": "2026-05-31T14:28:45.123Z",
  "estimatedCost": {
    "apiCalls": 8,
    "estimatedUSDCost": 0.04
  }
}
```

**Error Responses**:
| Code | Scenario | Example |
|------|----------|---------|
| 400 | Invalid query (too short/long, malformed) | `{ "error": "Query must be 10–500 characters" }` |
| 401 | Missing/invalid auth token | `{ "error": "Unauthorized" }` |
| 429 | Rate limit exceeded | `{ "error": "Rate limited. Retry after 60 seconds." }` |
| 503 | All search providers unavailable | `{ "error": "Search providers unavailable. Try again later." }` |

---

#### **GET** `/api/research/status/:taskId`

Real-time status of an active research task.

**Response**:
```json
{
  "taskId": "task_abc123xyz789",
  "status": "researching",
  "progress": {
    "currentStep": "Analyzing sources",
    "completedSteps": ["Planning", "Initial Search"],
    "totalSteps": 4,
    "percentComplete": 50
  },
  "runtime": {
    "elapsedSeconds": 45,
    "estimatedRemainingSeconds": 45
  },
  "costs": {
    "apiCallsUsed": 4,
    "estimatedTotalCost": 0.04,
    "currencyCode": "USD"
  },
  "searchSummary": {
    "sourcesFound": 23,
    "credibleSourcesIdentified": 18,
    "conflictingClaimsDetected": 2
  }
}
```

**Status Values**: `initialized`, `planning`, `researching`, `synthesizing`, `completed`, `failed`, `cancelled`

---

#### **GET** `/api/research/results/:taskId`

Retrieves completed research report and metadata.

**Response**:
```json
{
  "taskId": "task_abc123xyz789",
  "status": "completed",
  "query": "Latest developments in quantum computing 2025",
  "completedAt": "2026-05-31T14:28:32.456Z",
  "totalDuration": "5 minutes 12 seconds",
  "report": {
    "title": "Latest Developments in Quantum Computing 2025",
    "summary": "Quantum computing has advanced significantly...",
    "sections": [
      {
        "heading": "Recent Breakthroughs",
        "content": "Multiple organizations announced... [1][2]",
        "citations": [
          { "id": 1, "title": "...", "url": "...", "date": "2025-..." },
          { "id": 2, "title": "...", "url": "...", "date": "2025-..." }
        ]
      }
    ],
    "format": "markdown",
    "wordCount": 2847
  },
  "metadata": {
    "sources": {
      "total": 23,
      "credible": 18,
      "disputed": 2
    },
    "costs": {
      "totalApiCalls": 8,
      "totalUSDCost": 0.039,
      "breakdown": {
        "geminiCalls": 4,
        "tavilyCalls": 3,
        "googleSearchCalls": 1
      }
    },
    "researchSteps": [
      { "step": 1, "action": "Planning", "status": "completed", "duration": "3s" },
      { "step": 2, "action": "Initial Search", "status": "completed", "duration": "8s" },
      { "step": 3, "action": "Deep Analysis", "status": "completed", "duration": "45s" },
      { "step": 4, "action": "Synthesis & Validation", "status": "completed", "duration": "16s" }
    ]
  }
}
```

---

#### **GET** `/api/research/history`

Lists all research tasks (paginated).

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 20 | Results per page (1–100) |
| `offset` | number | 0 | Pagination offset |
| `sortBy` | string | `createdAt` | Sort field: `createdAt`, `query`, `status` |
| `sortOrder` | string | `desc` | `asc` or `desc` |

**Response**:
```json
{
  "tasks": [
    {
      "taskId": "task_abc123xyz789",
      "query": "Latest developments in quantum computing 2025",
      "status": "completed",
      "createdAt": "2026-05-31T14:23:45.123Z",
      "completedAt": "2026-05-31T14:28:32.456Z",
      "duration": "4m 47s"
    }
  ],
  "pagination": {
    "total": 156,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

---

#### **DELETE** `/api/research/:taskId`

Cancels a running task or deletes completed results.

**Response**:
```json
{
  "taskId": "task_abc123xyz789",
  "action": "cancelled",
  "message": "Research task cancelled. Results retained for 7 days."
}
```

---

### WebSocket

Real-time research updates via WebSocket.

**Connection**:
```
ws://localhost:3000?taskId=task_abc123xyz789&token=YOUR_AUTH_TOKEN_HERE
```

**Message Format** (server → client):
```json
{
  "type": "progress",
  "taskId": "task_abc123xyz789",
  "step": "Analyzing sources",
  "percentComplete": 50,
  "timestamp": "2026-05-31T14:25:12.345Z"
}
```

**Message Types**:
- `progress`: Task progress update
- `alert`: Warning or non-fatal error (e.g., one provider unavailable)
- `error`: Fatal error; task will not complete
- `completed`: Task finished successfully; final report available

**Reconnection Strategy**:
- Uses exponential backoff: delay = initial_delay × 1.5^(attempt - 1)
- Max 5 reconnection attempts (configurable via `WS_RECONNECT_MAX_ATTEMPTS`)
- Automatic server-side cleanup after 10 minutes of inactivity

---

## 📊 Error Handling & Recovery

### Failure Scenarios & Recovery

| Scenario | HTTP Code | Client Behavior | Recovery |
|----------|-----------|-----------------|----------|
| **Search provider timeout (10s)** | — | Hybrid: switches to alternate provider; Single: retries 2x | If both fail → returns partial results with confidence warning |
| **API quota exceeded** | 429 | Queues request; exponential backoff retry | User receives estimated wait time; can cancel task |
| **Invalid/expired auth token** | 401 | User prompted to re-enter token | Token auto-refresh attempted if within threshold |
| **WebSocket disconnection** | — | Automatic reconnect (up to 5 attempts) | After 5 failures, manual reconnect required; progress checkpoint saved |
| **Gemini API unavailable** | 503 | Task fails; search results cached from previous step | Notify user; offer to export partial results; retry later |
| **Cache miss (fresh data required)** | — | On-demand fetch; may add 2–5s latency | User sees loading indicator; cost tracked separately |

### Circuit Breaker Pattern

If a search provider fails 3 consecutive times, it is automatically disabled for 5 minutes to prevent cascading failures.

**Example Log Output**:
```
[2026-05-31 14:25:30] WARN: Tavily search failed (attempt 3/3)
[2026-05-31 14:25:30] INFO: Circuit breaker activated for Tavily. Fallback to Google search.
[2026-05-31 14:25:31] INFO: Research continuing with degraded search coverage.
```

---

## 🔒 Security Best Practices

### API Key Management
- **Never** commit `.env` to version control; use `.gitignore`
- Store credentials in a secure secrets manager (AWS Secrets Manager, HashiCorp Vault, GitHub Secrets for CI/CD)
- Rotate `AUTH_TOKEN` every 90 days
- Rotate API keys (Gemini, Tavily) every 6 months or immediately if compromised

### Token Lifecycle

**Client-Side Flow**:
1. User enters `AUTH_TOKEN` at startup or via auth modal
2. Token stored in `sessionStorage` (cleared on browser close)
3. Every request includes token in `Authorization: Bearer` header
4. Server validates token on each request
5. If token expires, client auto-attempts refresh (if within `TOKEN_REFRESH_THRESHOLD`)
6. If refresh fails, user prompted to re-enter token

**Server-Side Validation**:
```typescript
if (token.isExpired()) {
  return 401; // Unauthorized
}
if (Date.now() - token.issuedAt > MAX_TOKEN_AGE) {
  return 401; // Token too old, require re-authentication
}
```

### Session Storage

**Development**: In-memory sessions (lost on server restart)
**Production**: Redis or file-based sessions with encryption at rest

```bash
SESSION_STORE=redis  # Requires Redis running on default port 6379
# OR
SESSION_STORE=file   # Encrypted file storage in ./sessions
```

### Data Privacy

- **Client Cache**: Research stored in `localStorage` on client machine only; encrypted if `SESSION_STORE=file`
- **Server Cache**: Content cached on disk with automatic cleanup after `CACHE_TTL`
- **No Telemetry**: Usage data not sent to third parties (except required API calls to Gemini/Tavily)
- **GDPR Compliance**: All user data can be deleted via `DELETE /api/research/:taskId` endpoint

---

## 🧪 Testing & Quality Assurance

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm test -- --watch

# Run tests with coverage report
npm test -- --coverage

# Run specific test suite
npm test -- __tests__/analyzer.test.ts
```

**Test Coverage Target**: >85% for core agent logic (Planner, Analyzer, Synthesizer)

### Unit Test Structure

All tests use **Given/When/Then** structure:

```typescript
describe('Analyzer', () => {
  describe('extractClaims', () => {
    it('Given conflicting sources, When analyzing, Then flags claims as disputed', () => {
      // Given
      const sources = [
        { content: 'Claim A is true', url: 'source1.com' },
        { content: 'Claim A is false', url: 'source2.com' }
      ];

      // When
      const claims = analyzer.extractClaims(sources);

      // Then
      expect(claims).toContainEqual(
        expect.objectContaining({
          text: 'Claim A',
          disputed: true,
          perspectives: 2
        })
      );
    });
  });
});
```

### Integration Tests

Test full research pipeline:

```bash
npm test -- __tests__/integration/full-research-flow.test.ts
```

**Pre-requisites**: `GEMINI_API_KEY` and `TAVILY_API_KEY` must be set in `.env.test`

### E2E Testing (Coming Soon)

Automated browser testing with Playwright:

```bash
npm run test:e2e
```

### QA Checklist for Production Releases

- [ ] All tests passing (unit + integration + e2e)
- [ ] Code coverage >85% for core modules
- [ ] Security scan passed (npm audit, OWASP ZAP)
- [ ] Performance benchmarks met (<2s report generation for <100 sources)
- [ ] Documentation updated (README, API docs, changelog)
- [ ] Error handling verified (all edge cases covered)
- [ ] Auth token rotation completed
- [ ] Database migrations tested (if applicable)

---

## 🚀 Deployment

### Development

```bash
npm run dev
```

Starts server at `http://localhost:3000` with hot module reloading.

### Production Build

```bash
npm run build
npm run preview  # Local preview of production build
```

Outputs optimized bundle to `/dist`.

### Docker Deployment

**Dockerfile** (included in repo):

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

**Build & Run**:

```bash
docker build -t deep-research-agent:1.8.0 .
docker run -p 3000:3000 \
  -e GEMINI_API_KEY=your_key \
  -e AUTH_TOKEN=your_token \
  -e NODE_ENV=production \
  deep-research-agent:1.8.0
```

### Cloud Deployment (AWS, GCP, Azure)

#### **AWS ECS**

1. Push image to ECR:
   ```bash
   aws ecr get-login-password | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
   docker tag deep-research-agent:1.8.0 YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/deep-research-agent:1.8.0
   docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/deep-research-agent:1.8.0
   ```

2. Deploy with Terraform or CloudFormation (see `/infra` directory in repo)

#### **Google Cloud Run**

```bash
gcloud run deploy deep-research-agent \
  --image gcr.io/YOUR_PROJECT/deep-research-agent:1.8.0 \
  --platform managed \
  --region us-central1 \
  --set-env-vars GEMINI_API_KEY=your_key,NODE_ENV=production
```

#### **Environment-Specific Configuration**

| Environment | `NODE_ENV` | `SESSION_STORE` | `LOG_LEVEL` | Notes |
|-------------|-----------|-----------------|------------|-------|
| Development | `development` | `memory` | `debug` | Hot reload enabled |
| Staging | `staging` | `file` | `info` | Auth required; production-like |
| Production | `production` | `redis` | `warn` | HA setup; load balancer; CDN |

---

## 📖 Usage Examples

### Example 1: Basic Research Query

```bash
curl -X POST http://localhost:3000/api/research/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "query": "What are the latest breakthroughs in CRISPR gene editing?",
    "language": "en",
    "maxDepth": 3
  }'
```

### Example 2: Monitor Research Progress

```javascript
const taskId = 'task_abc123xyz789';
const ws = new WebSocket(
  `ws://localhost:3000?taskId=${taskId}&token=${AUTH_TOKEN}`
);

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log(`Progress: ${message.percentComplete}%`);
  console.log(`Current Step: ${message.step}`);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
  // Client will auto-reconnect
};
```

### Example 3: Export Report as PDF

```javascript
// After research completes, call export endpoint
const response = await fetch(
  `/api/research/results/${taskId}/export?format=pdf`,
  { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
);
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'research-report.pdf';
a.click();
```

---

## 🐛 Troubleshooting

### Common Issues

#### **WebSocket Connection Fails**

**Symptoms**: "WebSocket connection failed" message; no progress updates

**Solutions**:
1. Verify `AUTH_TOKEN` is correct (if enabled)
2. Check network connectivity (proxy/firewall may block WebSocket)
3. Ensure server is running: `npm run dev`
4. Check browser console for detailed error: `Ctrl+Shift+K` (Chrome/Firefox)
5. If behind a proxy, configure WebSocket proxy settings

**Logs**:
```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev
# Check for: "WebSocket handshake error", "Invalid token"
```

---

#### **Rate Limit Exceeded (429 Error)**

**Symptoms**: "Rate limited. Retry after 60 seconds."

**Causes**: Too many concurrent requests or high query volume

**Solutions**:
1. Increase `RATE_LIMIT_WINDOW_MS` or `RATE_LIMIT_REQUESTS` (if admin)
2. Reduce `MAX_CONCURRENT_SEARCHES` to throttle parallelism
3. Wait for rate limit window to reset (default: 60 seconds)
4. Implement client-side request queuing

---

#### **Search Returns No Results**

**Symptoms**: Empty source list or "0 sources found"

**Causes**: Query too specific, both providers temporarily down, rate-limited

**Solutions**:
1. Broaden query (e.g., "latest AI advances" instead of "GPT-5 feature X released May 2026")
2. Wait 60s and retry (may hit provider rate limits)
3. Check `SEARCH_MODE` is set correctly: `echo $SEARCH_MODE`
4. Verify API keys are valid: test manually on Tavily/Google console
5. Check server logs: `tail -f logs/server.log | grep -i search`

---

#### **PDF Export Fails**

**Symptoms**: Export button disabled or "PDF export failed"

**Causes**: Missing graphics library (headless Chrome), permission issues

**Solutions**:
1. On Linux: `sudo apt-get install chromium chromium-chromedriver`
2. On macOS: Install via Homebrew: `brew install chromium`
3. Verify write permissions: `touch ./exports/test.pdf`
4. Check logs for rendering errors: `LOG_LEVEL=debug`

---

#### **Memory/Performance Issues**

**Symptoms**: Slow response times, high CPU usage, "out of memory" crashes

**Causes**: Large cache, many concurrent searches, memory leak

**Solutions**:
1. Reduce `CACHE_TTL` or `RESULTS_MAX_AGE_DAYS`
2. Lower `MAX_CONCURRENT_SEARCHES` (e.g., 1–2 instead of 3+)
3. Enable memory profiling: `node --inspect-brk app.js`
4. Check for memory leaks: `npm install -g clinic && clinic doctor -- node app.js`
5. Monitor process: `watch -n 1 'ps aux | grep node'`

---

### Debug Logs

**Enable Full Debug Output**:

```bash
LOG_LEVEL=debug ENABLE_PERFORMANCE_LOGGING=true npm run dev
```

**Log Locations**:
- Console: All messages (development)
- File: `./logs/app.log` (production; auto-rotates daily)

**Key Log Patterns**:

| Pattern | Meaning | Action |
|---------|---------|--------|
| `[WARN] Circuit breaker activated for Tavily` | One provider down | Automatic fallback; continue monitoring |
| `[ERROR] Token validation failed` | Auth issue | Verify `AUTH_TOKEN` and expiry |
| `[INFO] Research completed in 45 seconds` | Normal completion | No action needed |
| `[ERROR] Gemini API error: 429` | Provider rate limited | Increase `CACHE_TTL` to reduce API calls |

---

## 📋 Known Limitations & Future Roadmap

### Current Limitations

1. **Max Query Length**: 500 characters (enforced by Gemini API)
2. **Research Depth**: Limited to 5 sub-queries per task (configurable but increases cost/latency)
3. **Concurrent Tasks**: Default 3 parallel searches (due to API rate limits)
4. **PDF Export**: Requires headless Chrome; not available in serverless environments (yet)
5. **Session Persistence**: Client-side `localStorage` only; cleared on browser reset (server-side sessions in roadmap)
6. **Multi-language**: Detection only; real-time translation planned for v2.0

### Planned Features (v1.9–v2.0)

- [ ] Real-time multi-language translation with cost tracking
- [ ] Structured data extraction (JSON schema validation)
- [ ] Integration with knowledge bases (Wikipedia, arXiv, academic databases)
- [ ] Custom AI models (bring your own LLM)
- [ ] Collaborative research (multi-user sessions)
- [ ] Citation compliance (APA, MLA, Chicago auto-formatting)
- [ ] Image & video analysis in sources
- [ ] Fact-checking with Snopes/FactCheck.org integration

---

## 🔄 Changelog

For detailed version history, see [Changelog.md](./Changelog.md) in the repository root.

**Recent Changes (v1.8.0)**:
- Fixed hardcoded file path issue in documentation
- Added comprehensive error handling & recovery strategies
- Implemented circuit breaker pattern for provider failures
- Added cost estimation & tracking per research task
- Enhanced WebSocket reconnection with exponential backoff
- Added production deployment guides (Docker, AWS, GCP, Azure)
- Improved security documentation & token lifecycle management

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

Includes dependencies licensed under Apache 2.0, ISC, and BSD 3-Clause.

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on submitting issues, pull requests, and development setup.

**Reporting Issues**: Use the [GitHub Issues](https://github.com/your-org/deep-research-agent/issues) template; include `LOG_LEVEL=debug` output.

---

## 💬 Support

- **Documentation**: [https://github.com/your-org/deep-research-agent/wiki](https://github.com/your-org/deep-research-agent/wiki)
- **Email**: support@your-org.com
- **Discord Community**: [Link to community server]
- **Security Issues**: security@your-org.com (do not open public issues)

---

**Maintained by**: Your Organization
**Active Contributors**: See [CONTRIBUTORS.md](./CONTRIBUTORS.md)
**Last Updated**: May 31, 2026
**Version**: 1.8.0 ✅
