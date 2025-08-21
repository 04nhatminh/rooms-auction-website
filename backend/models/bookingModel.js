const pool = require('../config/database');
class BookingModel {

    static async findBookingById(bookingID)
    {
        try {
            const query = `SELECT b.BookingID, b.BidID, b.UserID, p.Name, b.WinningPrice, b.StartDate, b.EndDate, b.BookingStatus
                           FROM Booking b
                           JOIN Products p ON b.ProductID = p.ProductID
                          WHERE b.BookingID = ?`;

            const [bookings] = await pool.query(query, [bookingID]);
            console.log(`Fetched booking details for ${bookingID}:`, bookings);
            return bookings[0] || null;

        } catch (error) {
            console.error ('Error fetching booking details:', error)
            throw error;
        }
    }

    static async updateBookingPaid(bookingID, methodID)
    {
        try {
            const [booking] = await pool.query('SELECT 1 FROM Booking WHERE BookingID=? AND BookingStatus = "pending"', [bookingID])

            if (!booking.length) {
                console.error(`Booking ${bookingID} not found or already paid`);
                throw new Error(`Booking ${bookingID} not found or already paid`);
            }
            console.log(`Updating booking paid status for ${bookingID} with methodID ${methodID}`);

            const query =   `UPDATE Booking
                        SET PaymentMethodID = ?, PaidAt = NOW(), BookingStatus = 'confirmed', UpdatedAt = NOW()
                        WHERE BookingID = ?`;
           
            await pool.query(query, [methodID, bookingID]);

            console.log(`Updated booking paid successfully`);

        } catch (error) {
            console.error ('Error updating booking paid:', error)
            throw error;
        }
    }

    
};

module.exports = BookingModel;