// 광고 랜딩 전용 설정 — CRM 앱의 루트 config.js 와 별개입니다.
// 배포 전 아래 두 값만 Supabase 프로젝트 값으로 바꾸세요.
// service_role 키가 아니라 anon 또는 publishable key를 사용해야 합니다.
//
// 이 키로 할 수 있는 일은 web_leads 에 줄 하나 넣는 것뿐입니다.
// 읽기·수정은 RLS 가 막습니다 — migration_43_web_leads.sql 을 보세요.
window.APEX_CONFIG = {
  url: "YOUR_PROJECT_URL",
  key: "YOUR_ANON_OR_PUBLISHABLE_KEY"
};
