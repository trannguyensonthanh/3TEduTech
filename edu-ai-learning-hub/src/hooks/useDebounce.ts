import { useState, useEffect } from 'react';

/**
 * Debounce một giá trị. Chỉ cập nhật giá trị trả về sau một khoảng thời gian chờ
 * kể từ lần cuối cùng giá trị đầu vào thay đổi.
 *
 * @template T Kiểu dữ liệu của giá trị cần debounce.
 * @param {T} value Giá trị đầu vào cần debounce.
 * @param {number} delay Thời gian chờ (miliseconds) trước khi cập nhật giá trị debounce.
 * @returns {T} Giá trị đã được debounce.
 */
export function useDebounce<T>(value: T, delay: number): T {
  // State để lưu trữ giá trị đã debounce
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(
    () => {
      // Thiết lập một timeout để cập nhật giá trị debounce sau khoảng `delay`
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      // Hàm cleanup: Hủy timeout nếu `value` hoặc `delay` thay đổi trước khi timeout kết thúc
      // Điều này đảm bảo rằng chỉ có timeout cuối cùng được thực thi.
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay] // Chỉ chạy lại effect nếu `value` hoặc `delay` thay đổi
  );

  // Trả về giá trị đã debounce
  return debouncedValue;
}

// Ví dụ cách sử dụng trong component (không cần copy phần này):
// function MyComponent() {
//   const [searchTerm, setSearchTerm] = useState('');
//   const debouncedSearchTerm = useDebounce(searchTerm, 500); // Chờ 500ms sau khi ngừng gõ

//   useEffect(() => {
//     // Gọi API với debouncedSearchTerm
//     if (debouncedSearchTerm) {
//       console.log('Searching for:', debouncedSearchTerm);
//       // fetchApi(debouncedSearchTerm);
//     } else {
//        // Xử lý khi search term rỗng
//     }
//   }, [debouncedSearchTerm]); // Chỉ chạy khi giá trị debounce thay đổi

//   return (
//     <input
//       type="text"
//       placeholder="Search..."
//       value={searchTerm}
//       onChange={(e) => setSearchTerm(e.target.value)}
//     />
//   );
// }
