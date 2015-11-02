
function run()
{
    var loader = document.getElementById('loader');
    loader.style.display = 'none';
}

function bootstrap()
{
    var script = document.createElement('script');
    script.addEventListener('load', run);
    script.src = 'dist/main.min.js?v1.0.1';
    document.head.appendChild(script);
}

window.addEventListener('load', bootstrap);
