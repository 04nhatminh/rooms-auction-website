const AuctionModel = require('../models/auctionModel');

async function autoEndAuctions() {
  const now = new Date();
  // Lấy các phiên đã hết hạn nhưng chưa ended
  const [rows] = await require('../config/database').query(
    `SELECT AuctionUID FROM Auction WHERE Status = 'active' AND EndTime < ?`, [now]
  );
  for (const row of rows) {
    await AuctionModel.setAuctionEnded(row.AuctionUID);
    await AuctionModel.notifyAuctionResult(row.AuctionUID);
  }
  console.log(`[AuctionScheduler] Đã kết thúc ${rows.length} phiên.`);
}

module.exports = { autoEndAuctions };