window.addEventListener('DOMContentLoaded', () => {
    // Injecter des polyfills ou des scripts supplémentaires si nécessaire
    const polyfills = [
        'https://polyfill.io/v3/polyfill.min.js?features=default,es6,es7',
    ];

    polyfills.forEach(src => {
        const script = document.createElement('script');
        script.src = src;
        document.head.appendChild(script);
    });
});
