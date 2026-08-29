const title =
    process.env.CONSOLE_TITLE ||
    (process.argv[2] || 'node').replace(/^[`'"]|[`'"]$/g, '');

if (process.stdout.isTTY) {
    process.stdout.write(`\u001b]0;${title}\u0007`);
}
