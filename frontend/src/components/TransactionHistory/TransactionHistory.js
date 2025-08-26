import React from 'react';
import './TransactionHistory.css';

const TransactionHistory = ({ title, transactions }) => {
    return (
        <div className="transaction-history">
            <div className='transaction-history-title'>
                <h3>{title}</h3>
            </div>
            <table className="transaction-history-table">
                <thead>
                    <tr>
                        <th>Mã giao dịch</th>
                        <th>Phòng</th>
                        <th>Địa điểm</th>
                        <th>Thời gian giao dịch</th>
                        <th>Phương thức</th>
                        <th>Số tiền</th>
                        <th>Trạng thái</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map(tx => (
                        <tr key={tx.paymentId}>
                            <td>{tx.providerTxnId || tx.paymentId}</td>
                            <td>{tx.room}</td>
                            <td>{tx.province}</td>
                            <td>{tx.createdAt}</td>
                            <td>{tx.provider}</td>
                            <td>{tx.amount ? tx.amount.toLocaleString('vi-VN') + ' ' + tx.currency : ''}</td>
                            <td>
                              {tx.status === 'captured' ? 'Thành công'
                                : tx.status === 'failed' ? 'Thất bại'
                                : tx.status === 'initiated' ? 'Khởi tạo'
                                : tx.status === 'authorized' ? 'Đã duyệt'
                                : tx.status === 'refunded' ? 'Hoàn tiền'
                                : tx.status === 'voided' ? 'Đã hủy'
                                : tx.status}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TransactionHistory;