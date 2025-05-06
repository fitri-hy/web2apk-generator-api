function template(url) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            overscroll-behavior-y: auto;
            margin: 0;
            padding: 0;
        }

        #pull-area {
            position: fixed;
            left: 0;
            width: 100%;
            transition: top 0.3s ease-out;
        }

        #pull-area.visible {
            top: 0;
        }

        .loading-bar {
            height: 2px;
            width: 0;
            transition: width 1s ease-out;
        }

        .refresh-message {
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
        }

        #pull-area.visible .refresh-message {
            opacity: 1;
        }
    </style>
</head>
<body>
    <div id="pull-area" class="text-center z-50">
        <div id="loading-bar" class="loading-bar bg-blue-500"></div>
    </div>

    <div class="content">
        <div class="fixed top-0 left-0 w-full z-40 h-4 bg-transparent"></div>
        <iframe src="${url}" class="h-screen w-full border-none" id="iframe"></iframe>
    </div>

    <script>
        const pullArea = document.getElementById('pull-area');
        const loadingBar = document.getElementById('loading-bar');
        const refreshMessage = document.querySelector('.refresh-message');
        let touchstartY = 0;

        document.addEventListener('touchstart', function(e) {
            touchstartY = e.touches[0].clientY;
        });

        document.addEventListener('touchmove', function(e) {
            const touchY = e.touches[0].clientY;
            const touchDiff = touchY - touchstartY;

            if (touchDiff > 0 && window.scrollY === 0) {
                pullArea.classList.add('visible');
                e.preventDefault();
                
                const progress = Math.min(touchDiff / 200, 1) * 100;
                loadingBar.style.width = progress + '%';
            }
        });

        document.addEventListener('touchend', function() {
            if (pullArea.classList.contains('visible')) {
                loadingBar.style.width = '100%';
                setTimeout(() => {
                    location.reload();
                }, 1000);
            }
        });
    </script>
</body>
</html>
`;}

module.exports = template;
