import React, { useEffect } from 'react';
import './Pagination.css';

const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.totalPages <= 1) {
    return null;
  }

  const { currentPage, totalPages } = pagination;
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;


  // Tạo array các số trang để hiển thị
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Điều chỉnh startPage nếu endPage đã đạt giới hạn
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Thêm trang đầu và dấu ... nếu cần
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('...');
      }
    }

    // Thêm các trang trong khoảng
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Thêm dấu ... và trang cuối nếu cần
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const handlePageClick = (page) => {
    if (page !== '...' && page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="pagination-container">
        {/* Nút Previous */}
        <button
          className={`pagination-btn ${!hasPreviousPage ? 'disabled' : ''}`}
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={!hasPreviousPage}
        >
          ‹ Trước
        </button>

        {/* Các số trang */}
        {pageNumbers.map((page, index) => (
          <button
            key={index}
            className={`pagination-btn ${
              page === currentPage ? 'active' : ''
            } ${page === '...' ? 'dots' : ''}`}
            onClick={() => handlePageClick(page)}
            disabled={page === '...'}
          >
            {page}
          </button>
        ))}

        {/* Nút Next */}
        <button
          className={`pagination-btn ${!hasNextPage ? 'disabled' : ''}`}
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={!hasNextPage}
        >
          Sau ›
        </button>
    </div>
  );
};

export default Pagination;
