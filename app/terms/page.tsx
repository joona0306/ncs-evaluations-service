import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">이용약관</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              최종 수정일: {new Date().toLocaleDateString("ko-KR")}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">제1조 (목적)</h2>
              <p className="text-sm text-muted-foreground">
                이 약관은 NCS 훈련생 성적관리 시스템(이하 &quot;서비스&quot;)이
                제공하는 온라인 서비스의 이용과 관련하여 서비스와 이용자 간의
                권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로
                합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">제2조 (정의)</h2>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
                <li>
                  <strong>&quot;서비스&quot;</strong>란 NCS 훈련생 성적관리
                  시스템이 제공하는 성적 관리 및 평가 관련 온라인 서비스를
                  의미합니다.
                </li>
                <li>
                  <strong>&quot;이용자&quot;</strong>란 이 약관에 따라 서비스를
                  이용하는 회원 및 비회원을 의미합니다.
                </li>
                <li>
                  <strong>&quot;회원&quot;</strong>이란 서비스에 회원등록을 하고
                  서비스를 이용하는 자를 의미합니다.
                </li>
                <li>
                  <strong>&quot;아이디(ID)&quot;</strong>란 회원의 식별과 서비스
                  이용을 위하여 회원이 정하고 서비스가 승인하는 문자와 숫자의
                  조합을 의미합니다.
                </li>
                <li>
                  <strong>&quot;비밀번호&quot;</strong>란 회원이 부여받은
                  아이디와 일치된 회원임을 확인하고 회원의 권익 보호를 위하여
                  회원이 정한 문자와 숫자의 조합을 의미합니다.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">
                제3조 (약관의 게시와 개정)
              </h2>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  ① 서비스는 이 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스
                  초기 화면에 게시합니다.
                </p>
                <p>
                  ② 서비스는 필요한 경우 관련 법령을 위배하지 않는 범위에서 이
                  약관을 개정할 수 있습니다.
                </p>
                <p>
                  ③ 서비스가 약관을 개정할 경우에는 적용일자 및 개정사유를
                  명시하여 현행약관과 함께 서비스의 초기화면에 그 적용일자 7일
                  이전부터 적용일자 전일까지 공지합니다.
                </p>
                <p>
                  ④ 이용자는 개정된 약관에 대해 거부할 권리가 있습니다. 이용자가
                  개정된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 회원
                  탈퇴를 할 수 있습니다.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">제4조 (회원가입)</h2>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  ① 회원가입은 신청자가 온라인으로 서비스에서 제공하는 소정의
                  가입신청 양식에서 요구하는 사항을 기록하여 가입을 완료하는
                  것으로 성립됩니다.
                </p>
                <p>
                  ② 서비스는 다음 각 호에 해당하는 경우 회원가입을 거부할 수
                  있습니다:
                </p>
                <ul className="list-disc list-inside ml-6 space-y-1">
                  <li>
                    가입신청자가 이 약관에 의하여 이전에 회원자격을 상실한 적이
                    있는 경우
                  </li>
                  <li>등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
                  <li>
                    기타 회원으로 등록하는 것이 서비스의 기술상 현저히 지장이
                    있다고 판단되는 경우
                  </li>
                </ul>
                <p>
                  ③ 회원가입의 성립시기는 서비스의 승낙이 회원에게 도달한
                  시점으로 합니다.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">
                제5조 (회원정보의 변경)
              </h2>
              <p className="text-sm text-muted-foreground">
                회원은 개인정보관리화면을 통하여 언제든지 본인의 개인정보를
                열람하고 수정할 수 있습니다. 다만, 서비스 관리를 위해 필요한
                실명, 아이디 등은 수정이 불가능합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">
                제6조 (개인정보보호)
              </h2>
              <p className="text-sm text-muted-foreground">
                서비스는 이용자의 개인정보 수집 및 이용에 대해서는
                개인정보처리방침을 적용하며, 이는 서비스 홈페이지에서 확인할 수
                있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">
                제7조 (서비스의 제공 및 변경)
              </h2>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>① 서비스는 다음과 같은 서비스를 제공합니다:</p>
                <ul className="list-disc list-inside ml-6 space-y-1">
                  <li>훈련생 성적 관리 및 조회 서비스</li>
                  <li>평가 및 평가 결과 관리 서비스</li>
                  <li>
                    기타 서비스가 추가로 개발하거나 제휴계약 등을 통해 제공하는
                    일체의 서비스
                  </li>
                </ul>
                <p>
                  ② 서비스는 필요한 경우 서비스의 내용을 추가 또는 변경할 수
                  있습니다. 이 경우 서비스는 추가 또는 변경 내용을 사전에
                  공지합니다.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">
                제8조 (서비스의 중단)
              </h2>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  ① 서비스는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장,
                  통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을
                  일시적으로 중단할 수 있습니다.
                </p>
                <p>
                  ② 서비스는 제1항의 사유로 서비스의 제공이 일시적으로
                  중단됨으로 인하여 이용자 또는 제3자가 입은 손해에 대하여
                  배상합니다. 단, 서비스가 고의 또는 과실이 없음을 입증하는
                  경우에는 그러하지 아니합니다.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">
                제9조 (회원의 의무)
              </h2>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>① 회원은 다음 행위를 하여서는 안 됩니다:</p>
                <ul className="list-disc list-inside ml-6 space-y-1">
                  <li>신청 또는 변경 시 허위내용의 등록</li>
                  <li>타인의 정보 도용</li>
                  <li>서비스가 게시한 정보의 변경</li>
                  <li>
                    서비스가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신
                    또는 게시
                  </li>
                  <li>
                    서비스와 기타 제3자의 저작권 등 지적재산권에 대한 침해
                  </li>
                  <li>
                    서비스와 기타 제3자의 명예를 손상시키거나 업무를 방해하는
                    행위
                  </li>
                  <li>
                    외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에
                    반하는 정보를 서비스에 공개 또는 게시하는 행위
                  </li>
                </ul>
                <p>
                  ② 회원이 제1항에 해당하는 행위를 한 경우, 서비스는 회원의
                  서비스 이용을 제한하거나 회원자격을 상실시킬 수 있습니다.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">
                제10조 (서비스의 권리와 의무)
              </h2>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  ① 서비스는 법령과 이 약관이 금지하거나 공서양속에 반하는
                  행위를 하지 않으며, 지속적이고 안정적으로 서비스를 제공하기
                  위하여 최선을 다하여 노력합니다.
                </p>
                <p>
                  ② 서비스는 이용자가 안전하게 서비스를 이용할 수 있도록
                  개인정보보호를 위해 보안시스템을 구축하며 개인정보처리방침을
                  공시하고 준수합니다.
                </p>
                <p>
                  ③ 서비스는 서비스와 관련하여 이용자로부터 제기된 의견이나
                  불만이 정당하다고 인정할 경우에는 이를 처리하여야 합니다.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">제11조 (면책조항)</h2>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  ① 서비스는 천재지변 또는 이에 준하는 불가항력으로 인하여
                  서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이
                  면제됩니다.
                </p>
                <p>
                  ② 서비스는 회원의 귀책사유로 인한 서비스 이용의 장애에
                  대하여는 책임을 지지 않습니다.
                </p>
                <p>
                  ③ 서비스는 회원이 서비스를 이용하여 기대하는 수익을 상실한
                  것에 대하여 책임을 지지 않으며, 그 밖의 서비스를 통하여 얻은
                  자료로 인한 손해에 관하여 책임을 지지 않습니다.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">
                제12조 (준거법 및 관할법원)
              </h2>
              <p className="text-sm text-muted-foreground">
                ① 이 약관의 해석 및 서비스와 회원 간의 분쟁에 대하여는 대한민국
                법을 적용합니다.
                <br />② 서비스와 회원 간 발생한 분쟁에 관한 소송은
                민사소송법상의 관할법원에 제기합니다.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
