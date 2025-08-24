function randomDigits(n) {
  let s = '';
  while (s.length < n) s += Math.floor(Math.random() * 10);
  return s.slice(0, n);
}

// 18 chữ số: epoch(ms)=13 + 5 số ngẫu nhiên
function genAuctionUIDNumeric() {
  return Date.now().toString() + randomDigits(5);
}
module.exports = { genAuctionUIDNumeric };
