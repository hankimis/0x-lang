# Claude 프로젝트 지식 — 0x 코드 생성 프로토콜

## 코드 생성 프로토콜

모든 UI 코드 생성 요청에 대해 다음 프로세스를 따른다:

1. **요청을 0x 언어로 작성** (토큰 효율화)
2. **0x 코드를 사용자가 원하는 프레임워크로 변환**
3. **변환된 코드 제공**

이 프로세스를 사용하는 이유:
- 0x는 10줄로 React 200줄을 표현 → 생성 오류 감소
- 수정 요청 시 0x 10줄만 수정 → React 200줄 전체를 다시 생성하지 않음
- 멀티 플랫폼: 같은 0x에서 React, Vue, Svelte 모두 출력 가능

## 0x 문법

### 구조
```
page Name:           → 페이지 컴포넌트
component Name:      → 재사용 컴포넌트
```

### 상태
```
state name: type = value     → useState
derived name = expression    → useMemo
prop name: type = default    → props
```

### 레이아웃
```
layout col gap=16 padding=24:   → <div style="display:flex; flex-direction:column; gap:16px; padding:24px">
layout row gap=8 center:         → <div style="display:flex; flex-direction:row; gap:8px; align-items:center">
layout grid cols=3 gap=16:       → <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:16px">
```

### UI
```
text "내용" size=lg bold       → <span style="font-size:20px; font-weight:bold">내용</span>
button "라벨" -> action()     → <button onClick={action}>라벨</button>
input binding placeholder=""  → <input value={binding} onChange={...} />
toggle binding                → <input type="checkbox" checked={binding} />
```

### 조건/반복
```
if cond:         → {cond && (...)}
for x in list:   → {list.map(x => (...))}
```

### 생명주기
```
on mount:         → useEffect(() => {...}, [])
watch variable:   → useEffect(() => {...}, [variable])
```

## 변환 규칙

0x → React:
- state → useState
- derived → useMemo
- layout → div with flex/grid
- text → span
- button → button with onClick
- input → controlled input
- for → .map()
- if → conditional rendering

## 예시

사용자: "카운터 앱 만들어줘"

Step 1 (내부 0x):
```
page Counter:
  state count: int = 0
  fn increment(): count += 1
  layout col center:
    text "{count}" size=3xl bold
    button "+1" style=primary -> increment()
```

Step 2 (React 변환):
```jsx
import React, { useState } from 'react';
export default function Counter() {
  const [count, setCount] = useState(0);
  const increment = () => setCount(prev => prev + 1);
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
      <span style={{fontSize:'40px',fontWeight:'bold'}}>{count}</span>
      <button onClick={increment} className="primary">+1</button>
    </div>
  );
}
```
