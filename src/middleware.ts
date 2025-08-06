import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/'])

// Comprehensive Bot-Detection Patterns
const botPatterns = [
  // Common crawlers and bots
  'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python', 'scanner',
  'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider', 'yandexbot',
  'facebookexternalhit', 'twitterbot', 'linkedinbot', 'whatsapp', 'telegram',
  
  // Security scanners and hacking tools
  'nmap', 'sqlmap', 'nikto', 'dirb', 'gobuster', 'wpscan', 'nuclei', 'burp',
  'metasploit', 'nessus', 'openvas', 'acunetix', 'netsparker', 'websecurify',
  'sqlninja', 'havij', 'pangolin', 'jsql', 'blind', 'union', 'injection',
  
  // Generic automation tools
  'postman', 'insomnia', 'httpie', 'restclient', 'junit', 'selenium',
  'phantomjs', 'headless', 'automated', 'test', 'monitor', 'check',
  
  // Suspicious user agents
  'mozilla/4.0', 'mozilla/3.0', 'mozilla/2.0', 'mozilla/1.0',
  'compatible;', 'crawler', 'libwww', 'lwp', 'apache-httpclient'
]

// Malicious and suspicious paths
const suspiciousPaths = [
  // PHP vulnerabilities
  '.php', '.asp', '.jsp', '.cgi', '.pl', '.py',
  '/wp-', '/wordpress', '/admin/', '/administrator', '/phpmyadmin',
  '/cpanel', '/plesk', '/webmail', '/mail', '/email',
  
  // Common attack vectors
  '/shell', '/upload', '/uploads', '/files', '/download', '/downloads',
  '/config', '/configuration', '/settings', '/setup', '/install',
  '/backup', '/backups', '/database', '/db', '/mysql', '/postgresql',
  '/redis', '/mongodb', '/elastic', '/solr', '/kibana',
  
  // Directory traversal attempts
  '../', '..\\', '%2e%2e', '%252e%252e', '....', '.....', 
  '/etc/', '/var/', '/tmp/', '/home/', '/root/', '/usr/',
  
  // File extensions that shouldn't exist
  '.bak', '.backup', '.old', '.orig', '.save', '.tmp', '.temp',
  '.log', '.error', '.debug', '.trace', '.conf', '.config',
  '.sql', '.db', '.sqlite', '.mdb', '.env', '.ini',
  
  // Common malicious files
  '/robots.txt', '/sitemap.xml', '/crossdomain.xml', '/clientaccesspolicy.xml',
  '/favicon.ico', '/apple-touch-icon', '/browserconfig.xml',
  
  // API endpoints we don't have
  '/api/v1/', '/api/v2/', '/rest/', '/graphql', '/soap',
  '/xmlrpc', '/rpc/', '/jsonrpc', '/json-rpc'
]

// Rate limiting map (simple in-memory for demo, use Redis in production)
const requestCounts = new Map<string, { count: number; resetTime: number }>()

// IP whitelist (your IPs)
const allowedIPs = [
  '127.0.0.1', 
  '::1',
  // Add your actual IP addresses here if needed
]

export default clerkMiddleware(async (auth, req) => {
  const userAgent = req.headers.get('user-agent') || ''
  const pathname = req.nextUrl.pathname.toLowerCase()
  const ip = req.headers.get('cf-connecting-ip') || 
            req.headers.get('x-forwarded-for') || 
            req.headers.get('x-real-ip') || 
            'unknown'
  const now = Date.now()

  // Always allow your own IPs
  if (allowedIPs.includes(ip)) {
    if (!isPublicRoute(req)) {
      await auth.protect()
    }
    return
  }

  // Block empty or suspicious user agents
  if (!userAgent || userAgent.length < 5 || userAgent.length > 500) {
    console.log(`🚫 Suspicious user agent blocked: "${userAgent}" from ${ip}`)
    return new Response('Forbidden', { 
      status: 403,
      headers: { 
        'Content-Type': 'text/plain',
        'X-Blocked-Reason': 'Invalid user agent'
      }
    })
  }

  // Block known bots and scanners
  if (botPatterns.some(pattern => userAgent.toLowerCase().includes(pattern))) {
    console.log(`🚫 Bot blocked: ${userAgent} from ${ip} - ${pathname}`)
    return new Response('Access Denied - Bots not allowed', { 
      status: 403,
      headers: { 
        'Content-Type': 'text/plain',
        'X-Blocked-Reason': 'Bot detected'
      }
    })
  }

  // Block suspicious paths
  if (suspiciousPaths.some(pattern => pathname.includes(pattern.toLowerCase()))) {
    console.log(`🚫 Suspicious path blocked: ${pathname} from ${ip}`)
    return new Response('Not Found', { 
      status: 404,
      headers: { 
        'Content-Type': 'text/plain',
        'X-Blocked-Reason': 'Suspicious path'
      }
    })
  }

  // Simple rate limiting (100 requests per 10 minutes per IP)
  const rateLimitKey = ip
  const rateLimitWindow = 10 * 60 * 1000 // 10 minutes
  const rateLimitMax = 100

  const existing = requestCounts.get(rateLimitKey)
  if (existing && now < existing.resetTime) {
    if (existing.count >= rateLimitMax) {
      console.log(`🚫 Rate limit exceeded: ${ip} (${existing.count} requests)`)
      return new Response('Too Many Requests', { 
        status: 429,
        headers: { 
          'Content-Type': 'text/plain',
          'Retry-After': Math.ceil((existing.resetTime - now) / 1000).toString(),
          'X-Blocked-Reason': 'Rate limit exceeded'
        }
      })
    }
    existing.count++
  } else {
    requestCounts.set(rateLimitKey, { count: 1, resetTime: now + rateLimitWindow })
  }

  // Clean up old rate limit entries (simple cleanup)
  if (Math.random() < 0.01) { // 1% chance to cleanup
    for (const [key, value] of requestCounts.entries()) {
      if (now > value.resetTime) {
        requestCounts.delete(key)
      }
    }
  }

  // Block requests with suspicious headers
  const referer = req.headers.get('referer') || ''
  
  if (referer && (referer.includes('scanner') || referer.includes('bot'))) {
    console.log(`🚫 Suspicious referer blocked: ${referer} from ${ip}`)
    return new Response('Forbidden', { 
      status: 403,
      headers: { 
        'Content-Type': 'text/plain',
        'X-Blocked-Reason': 'Suspicious referer'
      }
    })
  }

  // Continue with normal Clerk middleware
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
