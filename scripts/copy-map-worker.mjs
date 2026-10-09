import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('public/map-worker',{recursive:true});
for(const name of ['maplibre-gl-worker.mjs','maplibre-gl-shared.mjs'])await copyFile('node_modules/maplibre-gl/dist/'+name,'public/map-worker/'+name);
