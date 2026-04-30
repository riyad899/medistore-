// Auth routes are mounted directly in src/index.ts (not via this Router)
// because better-auth's toNodeHandler requires the full URL path including
// the /api/auth base prefix. Express Routers strip the mount prefix from
// req.url which breaks toNodeHandler's route matching.
//
// This file is kept for reference but is no longer imported.
