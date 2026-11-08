import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      /* [SỬA] Trước đây tắt hẳn ("off"), nên biến và import không dùng tích tụ
         mà không ai thấy. Đặt mức "warn" kèm bỏ qua tham số bắt đầu bằng "_". */
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      /* [SỬA] Trong bộ quy tắc khuyến nghị của react-hooks, quy tắc này chỉ ở
         mức "warn" nên chưa bao giờ chặn được gì. Mảng phụ thuộc sai gây ra
         closure cũ — đúng loại lỗi khó lần ra nhất khi gỡ rối. */
      "react-hooks/exhaustive-deps": "error",
    },
  }
);
