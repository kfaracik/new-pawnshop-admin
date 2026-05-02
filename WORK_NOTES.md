# Zakres Prac

## Accessibility

- Dodano skip link do treści.
- Dodano globalne stany `focus-visible`.
- Dodano wsparcie dla `prefers-reduced-motion`.
- Poprawiono etykiety formularza produktu, identyfikatory pól i komunikat błędu `role="alert"`.
- Poprawiono alternatywny tekst dla avatara użytkownika i podstawową semantykę nawigacji.

## Technical Debt

- Projekt nadal jest mieszany: `pages`, `components`, `lib`, `models`.
- Duża część panelu nadal wymaga migracji do TS oraz dalszego wydzielania logiki z komponentów.
- Nadal występują miejsca z użyciem `<img>` zamiast zoptymalizowanego obrazu.

## Animations

- Panel nie potrzebuje ciężkich animacji; obecny poziom prostych przejść jest wystarczający.
- Kluczowe było zapewnienie trybu `prefers-reduced-motion`.
- Dalsze prace: ograniczyć niepotrzebne `transition-all` i wprowadzić spójne zasady motion dla panelu.

## Dalsze kroki

- Wydzielenie `features/products`, `features/categories`, `features/orders`.
- Migracja większych komponentów formularzy i widoków list do TS.
- Dodanie testów dla API routes i krytycznych formularzy.

## Duże pliki do dalszego podziału

- `pages/categories.js` został zredukowany przez wydzielenie `components/CategoryForm.js` i `components/CategoryList.js`.
- `components/ProductForm.js` powinien finalnie przejść do TS i dostać mniejsze podkomponenty pól.
- `pages/orders.js` oraz `pages/products.js` po mobile polish nadają się do dalszego przeniesienia do `features/*`.
