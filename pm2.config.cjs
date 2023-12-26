module.exports = {
    apps: [
        {
            name: 'invoi-backend',
            script: 'npm',
            args: ['start'],
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
            },
        },
    ],
};
