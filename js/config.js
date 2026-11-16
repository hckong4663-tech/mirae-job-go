/* 미래 JOB GO 설정 — PUBLIC_KEY_JWK는 관리자 서명키의 공개키입니다(개인키 아님). 키를 바꾸면 관리자 도구가 새 config.js를 만들어 줍니다. */
window.MJG_CONFIG={
  "APP_VERSION": "1.0.0",
  "BUILD": "202611161045",
  "UPDATE_URL": "data/content.json",
  "UPDATE_SIG_URL": "data/content.json.sig",
  "PUBLIC_KEY_JWK": {
    "kty": "EC",
    "crv": "P-256",
    "x": "62JIVMOEchyhm852c_bJMi6kHyO-Py-rIc7INNEpCk8",
    "y": "2hhc-MHGlaCSx3UuYQeZkmQVnmUR4tztFTxXWj_o6do",
    "ext": true
  }
};
