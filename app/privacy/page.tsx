import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">개인정보처리방침</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              최종 수정일: {new Date().toLocaleDateString("ko-KR")}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">
                1. 개인정보의 처리 목적
              </h2>
              <p className="text-sm text-muted-foreground mb-2">
                NCS 훈련생 성적관리 시스템(이하 &quot;서비스&quot;)은 다음의
                목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는
                다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이
                변경되는 경우에는 개인정보보호법 제18조에 따라 별도의 동의를
                받는 등 필요한 조치를 이행할 예정입니다.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
                <li>
                  <strong>회원 가입 및 관리:</strong> 회원 가입의사 확인, 회원제
                  서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스
                  부정이용 방지, 각종 고지·통지 목적
                </li>
                <li>
                  <strong>성적 관리 서비스 제공:</strong> 훈련생의 성적 평가,
                  성적 기록 및 조회, 평가 결과 관리
                </li>
                <li>
                  <strong>고객 문의 대응:</strong> 민원인의 신원 확인, 민원사항
                  확인, 사실조사를 위한 연락·통지, 처리결과 통보
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">
                2. 개인정보의 처리 및 보유기간
              </h2>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  서비스는 법령에 따른 개인정보 보유·이용기간 또는
                  정보주체로부터 개인정보를 수집 시에 동의받은 개인정보
                  보유·이용기간 내에서 개인정보를 처리·보유합니다.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>회원 정보:</strong> 회원 탈퇴 시까지 (단, 관계 법령
                    위반에 따른 수사·조사 등이 진행중인 경우에는 해당 수사·조사
                    종료 시까지)
                  </li>
                  <li>
                    <strong>성적 정보:</strong> 교육 과정 종료 후 3년간 보관
                    (교육 관련 법령에 따라)
                  </li>
                  <li>
                    <strong>계약 또는 청약철회 등에 관한 기록:</strong> 5년
                    (전자상거래법)
                  </li>
                  <li>
                    <strong>대금결제 및 재화 등의 공급에 관한 기록:</strong> 5년
                    (전자상거래법)
                  </li>
                  <li>
                    <strong>소비자의 불만 또는 분쟁처리에 관한 기록:</strong>{" "}
                    3년 (전자상거래법)
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">
                3. 처리하는 개인정보의 항목
              </h2>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>서비스는 다음의 개인정보 항목을 처리하고 있습니다:</p>
                <div className="ml-4 space-y-2">
                  <div>
                    <strong>필수 항목:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>이름, 이메일 주소, 비밀번호, 전화번호</li>
                      <li>역할 정보 (훈련생/훈련교사/관리자)</li>
                      <li>서비스 이용 기록, 접속 로그, 쿠키, 접속 IP 정보</li>
                    </ul>
                  </div>
                  <div>
                    <strong>선택 항목:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>마케팅 정보 수신 동의 시: 이메일 주소</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">
                4. 개인정보의 제3자 제공
              </h2>
              <p className="text-sm text-muted-foreground">
                서비스는 원칙적으로 정보주체의 개인정보를 제3자에게 제공하지
                않습니다. 다만, 다음의 경우에는 예외로 합니다:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4 mt-2">
                <li>정보주체가 사전에 동의한 경우</li>
                <li>
                  법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와
                  방법에 따라 수사기관의 요구가 있는 경우
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">
                5. 개인정보처리의 위탁
              </h2>
              <p className="text-sm text-muted-foreground">
                서비스는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보
                처리업무를 위탁하고 있습니다:
              </p>
              <div className="ml-4 mt-2 text-sm text-muted-foreground">
                <div className="space-y-2">
                  <div>
                    <strong>위탁업체:</strong> Supabase (클라우드 인프라 서비스)
                  </div>
                  <div>
                    <strong>위탁 업무 내용:</strong> 데이터 저장 및 관리, 서버
                    운영
                  </div>
                  <div>
                    <strong>위탁 기간:</strong> 서비스 제공 기간 동안
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">
                6. 정보주체의 권리·의무 및 행사방법
              </h2>
              <p className="text-sm text-muted-foreground mb-2">
                정보주체는 다음과 같은 권리를 행사할 수 있습니다:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
                <li>개인정보 열람 요구</li>
                <li>개인정보 정정·삭제 요구</li>
                <li>개인정보 처리정지 요구</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                위 권리 행사는 서비스에 대해 개인정보보호법 시행령 제41조
                제1항에 따라 서면, 전자우편, 모사전송(FAX) 등을 통하여 하실 수
                있으며, 서비스는 이에 대해 지체없이 조치하겠습니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. 개인정보의 파기</h2>
              <p className="text-sm text-muted-foreground mb-2">
                서비스는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가
                불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.
              </p>
              <div className="ml-4 space-y-2 text-sm text-muted-foreground">
                <div>
                  <strong>파기 절차:</strong> 이용자가 입력한 정보는 목적 달성
                  후 별도의 DB에 옮겨져(종이의 경우 별도의 서류) 내부 방침 및
                  기타 관련 법령에 따라 일정기간 저장된 후 혹은 즉시 파기됩니다.
                </div>
                <div>
                  <strong>파기 방법:</strong> 전자적 파일 형태의 정보는 기록을
                  재생할 수 없는 기술적 방법을 사용합니다.
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">
                8. 개인정보 보호책임자
              </h2>
              <p className="text-sm text-muted-foreground mb-2">
                서비스는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보
                처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와
                같이 개인정보 보호책임자를 지정하고 있습니다.
              </p>
              <div className="ml-4 space-y-1 text-sm text-muted-foreground">
                <div>
                  <strong>개인정보 보호책임자</strong>
                </div>
                <div>이메일: [관리자 이메일 주소를 입력하세요]</div>
                <div className="mt-2">
                  정보주체께서는 서비스의 서비스를 이용하시면서 발생한 모든
                  개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을
                  개인정보 보호책임자에게 문의하실 수 있습니다.
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">
                9. 개인정보의 안전성 확보 조치
              </h2>
              <p className="text-sm text-muted-foreground mb-2">
                서비스는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고
                있습니다:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
                <li>
                  관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육 등
                </li>
                <li>
                  기술적 조치: 개인정보처리시스템 등의 접근권한 관리,
                  접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램
                  설치
                </li>
                <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">
                10. 개인정보처리방침 변경
              </h2>
              <p className="text-sm text-muted-foreground">
                이 개인정보처리방침은 법령·정책 또는 보안기술의 변경에 따라
                내용의 추가·삭제 및 수정이 있을 시에는 변경사항의 시행 7일
                전부터 서비스 홈페이지의 공지사항을 통하여 고지할 것입니다.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
