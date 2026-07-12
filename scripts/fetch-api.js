async function main() {
    const res = await fetch("http://localhost:3000/api/products");
    const json = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Total products returned: ${json.total}`);
    if (json.error) console.error("Error:", json.error);
}
main();
