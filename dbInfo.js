
const PW = "Relyt352%21" //URL ENCODED: ORIGINAL IS "Relyt352!"
const dev_db_url= `mongodb+srv://Knapptr:${PW}@cluster0-m6riz.gcp.mongodb.net/test?retryWrites=true&w=majority`;
const dbConnect = process.env.MONGODB_URI || dev_db_url;

module.exports = dbConnect

