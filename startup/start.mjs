import {playStartup} from '/startup/animation.mjs';
try {const response=await fetch('/startup/config.json');if(response.ok)await playStartup(await response.json());}catch(error){console.warn('Startup animation unavailable:',error);}
