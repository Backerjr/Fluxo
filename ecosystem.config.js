module.exports = {
  apps: [
    {
      name: 'fluxo',
      script: './dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
      },
      // Restart configuration
      max_memory_restart: '500M',
      min_uptime: '10s',
      max_restarts: 10,
      autorestart: true,
      watch: false,
      // Logging
      error_file: '/var/log/fluxo/error.log',
      out_file: '/var/log/fluxo/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Advanced features
      listen_timeout: 10000,
      kill_timeout: 5000,
      wait_ready: true,
      // Graceful shutdown
      shutdown_with_message: true,
    },
  ],
  
  deploy: {
    production: {
      user: 'ubuntu',
      host: process.env.PRODUCTION_SERVER_HOST,
      ref: 'origin/main',
      repo: 'https://github.com/Backerjr/Fluxo.git',
      path: '/home/ubuntu/fluxo',
      'post-deploy': 'pnpm install --frozen-lockfile && pnpm build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'mkdir -p /var/log/fluxo',
    },
  },
};
