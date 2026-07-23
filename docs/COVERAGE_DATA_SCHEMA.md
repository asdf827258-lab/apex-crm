# COVERAGE DATA SCHEMA — 구조화 데이터 명세

## 1. 핵심 엔터티

### profiles
사용자와 권한.

- id
- name
- email
- role: admin | manager | advisor | reviewer
- active
- organization_id

### clients
고객 기본정보.

- id
- advisor_id
- name_masked
- birth_year
- gender
- occupation
- monthly_income
- monthly_fixed_expense
- household_notes
- retirement_age
- affordability_limit
- consent_status

### households
가족 단위 분석.

- client_id
- spouse / children / dependents
- household_income
- household_expense
- debt
- liquid_assets
- care_responsibility

### documents
업로드 파일 메타데이터.

- id
- client_id
- kind
- file_name
- storage_path
- checksum
- page_count
- parse_status
- uploaded_by
- created_at

### document_pages
페이지별 원문과 이미지.

- document_id
- page_no
- extracted_text
- image_path
- ocr_status
- confidence

### extraction_runs
AI 추출 실행 이력.

- document_id
- model
- schema_version
- raw_json
- validation_errors
- reviewer_id
- approved_at

### policies
계약 단위.

- id
- client_id
- source_document_id
- insurer
- product_name
- policy_status
- policyholder
- insured
- issue_date
- monthly_premium
- payment_term
- coverage_term
- renewable
- indemnity_generation
- surrender_type
- premium_waiver
- underwriting_notes

### coverages
담보 단위.

- policy_id
- original_name
- normalized_code
- normalized_name
- category
- amount
- unit
- payment_frequency
- max_payments
- waiting_period
- reduction_period
- coverage_start
- coverage_end
- renewable
- exclusions
- source_page
- source_text
- confidence
- verification_status

### proposals / proposal_plans
새 제안서와 플랜.

- proposal_id
- plan_name
- insurer
- product
- monthly_premium
- payment_term
- coverage_term
- coverages
- underwriting_assumptions
- proposal_date

### analysis_cases
한 번의 분석 프로젝트.

- client_id
- current_policy_snapshot
- proposal_snapshot
- client_context_snapshot
- rule_version
- extraction_version
- status
- created_by

### comparison_scenarios
A/B/C안.

- analysis_case_id
- scenario_type
- title
- monthly_premium_before
- monthly_premium_after
- estimated_total_payment_before
- estimated_total_payment_after
- keep_items
- adjust_items
- add_items
- risks
- advantages
- disadvantages

### knowledge_rules
윤시현 판단 규칙.

- id
- rule_type
- scope
- priority
- conditions_json
- action_json
- rationale
- source_case_id
- approved_by
- approved_at
- version
- active

### advisor_feedback
분석 결과 수정.

- analysis_case_id
- target_type
- target_id
- before_value
- after_value
- reason
- feedback_category
- created_by

### report_versions
고객용·설계사용 결과.

- analysis_case_id
- report_type
- structured_json
- rendered_html
- created_by
- created_at

### audit_logs
누가 무엇을 봤고 수정했는지 기록.

---

## 2. 문서 추출 JSON

```json
{
  "schemaVersion": "1.0",
  "document": {
    "type": "proposal",
    "fileName": "sample.pdf",
    "pageCount": 42
  },
  "people": {
    "policyholder": null,
    "insured": null
  },
  "policies": [
    {
      "insurer": null,
      "productName": null,
      "monthlyPremium": null,
      "paymentTerm": null,
      "coverageTerm": null,
      "renewable": null,
      "coverages": [
        {
          "originalName": null,
          "normalizedCode": null,
          "amount": null,
          "unit": "KRW",
          "paymentFrequency": null,
          "source": {
            "page": 0,
            "text": null,
            "confidence": 0
          }
        }
      ]
    }
  ],
  "totals": {
    "monthlyPremium": null,
    "calculatedPremium": null,
    "matches": null
  },
  "warnings": [],
  "unresolved": []
}
```

## 3. 분석 JSON

```json
{
  "analysisVersion": "1.0",
  "oneLineConclusion": "",
  "strengths": [],
  "gaps": [],
  "duplicates": [],
  "structuralRisks": [],
  "fourAccounts": {
    "medicalExpense": {},
    "treatmentExpense": {},
    "incomeGap": {},
    "familyBurden": {}
  },
  "policyDecisions": [
    {
      "policyId": "",
      "decision": "KEEP|KEEP_AND_SUPPLEMENT|VERIFY|REDUCE_REVIEW|CONVERT_REVIEW|REALLOCATE|SURRENDER_CANDIDATE",
      "reasons": [],
      "requiredChecks": []
    }
  ],
  "scenarios": [],
  "advisorQuestions": [],
  "uncertainties": [],
  "complianceNotes": []
}
```

## 4. 데이터 검증 규칙

- PDF 합계 보험료와 담보별 합산보험료는 분리한다.
- 원문 없는 숫자는 저장하지 않는다.
- 같은 문서가 재업로드되면 checksum으로 감지한다.
- 고객이 직접 수정한 값은 AI 재분석으로 덮어쓰지 않는다.
- 모든 정규화 값은 원문 담보명을 함께 보존한다.
- 모든 분석은 사용한 규칙 버전과 모델 버전을 기록한다.
