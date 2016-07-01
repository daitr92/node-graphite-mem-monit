/**
 * Created by kahn on 04/06/2016.
 */
'use strict';

var graphite = require('graphite');

module.exports = (() => {
    if (!process.env.GRAPHITE_HOST || !process.env.GRAPHITE_PORT || !process.env.GRAPHITE_PATH) {
        throw new Error('Missing environment variable GRAPHITE_HOST, GRAPHITE_PORT, GRAPHITE_PATH');
    } else {
        let graphitePaths = (process.env.GRAPHITE_PATH || '').split('.');
        const client = graphite.createClient('plaintext://' + process.env.GRAPHITE_HOST + ':' + process.env.GRAPHITE_PORT);

        let memoryMetrics = {};
        let currentDeep = memoryMetrics;

        graphitePaths.forEach((path) => {
            currentDeep[path] = {};
            currentDeep = currentDeep[path];
        });

        setInterval(() => {
            let mem = process.memoryUsage();

            currentDeep.rss = mem.rss/1024/1024;
            currentDeep.total = mem.heapTotal/1024/1024;
            currentDeep.used = mem.heapUsed/1024/1024;

            client.write(memoryMetrics);

            if (process.env.GRAPHITE_TRIGGER_GC === 'true' &&
                currentDeep.used > Number(process.env.GRAPHITE_TRIGGER_GC_LIMIT_HEAP) &&
                global.gc) {
                global.gc()
            }
        }, Number(process.env.GRAPHITE_INTERVAL) || 10000);
    }
})();
