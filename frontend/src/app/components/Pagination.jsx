import { useState } from 'react';
 
const styles = {
  paginationContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '15px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif'
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#ffffff',
    padding: '8px',
    borderRadius: '12px',
    border: '1px solid #e0e0e0',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
  },
  paginationBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    backgroundColor: 'transparent',
    color: '#555',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    userSelect: 'none'
  },
  paginationBtnHover: {
    backgroundColor: '#f5f5f5',
    color: '#333'
  },
  paginationBtnDisabled: {
    color: '#ccc',
    cursor: 'not-allowed',
    opacity: '0.5'
  },
  paginationArrow: {
    fontSize: '16px',
    fontWeight: 'bold'
  },
  paginationPages: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    margin: '0 8px'
  },
  paginationPage: {
    minWidth: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    color: '#555',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    userSelect: 'none'
  },
  paginationPageHover: {
    backgroundColor: '#f5f5f5',
    color: '#333'
  },
  paginationPageActive: {
    backgroundColor: '#646cff',
    color: '#fff',
    fontWeight: '600'
  },
  paginationPageEllipsis: {
    cursor: 'default',
    color: '#999',
    fontWeight: 'normal'
  }
};
 
function Pagination({
  currentPage = 1,
  totalPages = 10,
  onPageChange = () => {},
  maxVisiblePages = 5
}) {
  const [activePage, setActivePage] = useState(currentPage);
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const [hoveredPage, setHoveredPage] = useState(null);
 
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== activePage) {
      setActivePage(page);
      onPageChange(page);
    }
  };
 
  const handlePrevious = () => {
    if (activePage > 1) {
      handlePageChange(activePage - 1);
    }
  };
 
  const handleNext = () => {
    if (activePage < totalPages) {
      handlePageChange(activePage + 1);
    }
  };
 
  const getVisiblePages = () => {
    const pages = [];
    const half = Math.floor(maxVisiblePages / 2);
   
    let start = Math.max(1, activePage - half);
    let end = Math.min(totalPages, activePage + half);
   
    // Adjust if we're near the beginning or end
    if (end - start + 1 < maxVisiblePages) {
      if (start === 1) {
        end = Math.min(totalPages, start + maxVisiblePages - 1);
      } else if (end === totalPages) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
    }
   
    // Add first page and ellipsis if needed
    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push('...');
      }
    }
   
    // Add visible pages
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
   
    // Add ellipsis and last page if needed
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
   
    return pages;
  };
 
  const visiblePages = getVisiblePages();
 
  const getPaginationBtnStyle = (type, disabled) => {
    let style = { ...styles.paginationBtn };
   
    if (disabled) {
      style = { ...style, ...styles.paginationBtnDisabled };
    } else if (hoveredBtn === type) {
      style = { ...style, ...styles.paginationBtnHover };
    }
   
    return style;
  };
 
  const getPaginationPageStyle = (page, index) => {
    let style = { ...styles.paginationPage };
   
    if (page === '...') {
      style = { ...style, ...styles.paginationPageEllipsis };
    } else if (page === activePage) {
      style = { ...style, ...styles.paginationPageActive };
    } else if (hoveredPage === index && page !== '...') {
      style = { ...style, ...styles.paginationPageHover };
    }
   
    return style;
  };
 
  return (
    <div style={styles.paginationContainer}>
      <nav style={styles.pagination}>
        <button
          style={getPaginationBtnStyle('prev', activePage === 1)}
          onClick={handlePrevious}
          disabled={activePage === 1}
          onMouseEnter={() => setHoveredBtn('prev')}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          <span style={styles.paginationArrow}>‹</span>
          <span style={{ display: window.innerWidth >= 480 || window.innerWidth <= 606? 'none' : 'inline' }}>Previous</span>
        </button>
       
        <div style={styles.paginationPages}>
          {visiblePages.map((page, index) => (
            <button
              key={index}
              style={getPaginationPageStyle(page, index)}
              onClick={() => typeof page === 'number' && handlePageChange(page)}
              disabled={page === '...'}
              onMouseEnter={() => setHoveredPage(index)}
              onMouseLeave={() => setHoveredPage(null)}
            >
              {page}
            </button>
          ))}
        </div>
       
        <button
          style={getPaginationBtnStyle('next', activePage === totalPages)}
          onClick={handleNext}
          disabled={activePage === totalPages}
          onMouseEnter={() => setHoveredBtn('next')}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          <span style={{ display: window.innerWidth >= 480 || window.innerWidth <= 606? 'none' : 'inline' }}>Next</span>
          <span style={styles.paginationArrow}>›</span>
        </button>
      </nav>
    </div>
  );
}
 
export default Pagination;