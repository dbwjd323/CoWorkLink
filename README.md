# CoWorkLink
공동 작업 관리 플랫폼

## 🖥️프로젝트 소개
사용자가 프로젝트를 생성하고 팀원들과 협력하여 작업을 관리하고 공유할 수 있는 공동 작업 플랫폼입니다.<br>
다양한 분야의 프로젝트를 효율적으로 관리하고 팀원 간의 원활한 협업을 지원할 수 있는 웹 사이트를 개발하고자 진행하였습니다.

## 🕰️개발 기간
2023.11.03~2023.12.13<br><br>

## ⚙️개발 언어
**node.js, Express.js, Socket.io, MySql**<br>
**HTML, CSS, Javascript**

## 📍주요 기능
- 회원가입/로그인 후 이용 가능
- 프로젝트 생성
  - 프로젝트 이름, 설명, 마감일 지정 가능
  - 프로젝트 이름과 설명란은 필수 입력 필드라서 하나라도 누락 시 누락되었다는 알람 표시
  - 마감일을 지정하지 않은 경우, null 값이 들어가게 하고 My Project 페이지에서 마감일이 없음이라고 표시됨
  - 팀원들과 프로젝트를 같이 작업하기 위해, 팀 멤버를 아이디 입력 받음
  - 만약 users 테이블에 존재하지 않는 아이디를 입력한 경우, 어떤 아이디가 존재하지 않는 아이디인지 알려줌
- my project : 참여하는 프로젝트 목록
- 각 프로젝트에 해당하는 상세 정보를 불러오고 수정 가능
- 각 프로젝트에 해당하는 작업을 관리 - 작업 이름, 담당 팀원 지정, 진행상태 선택 가능(작업 전, 작업 중, 작업 완료)
- 채팅 기능 : Socket.io를 사용해 채팅 기능 구현
  - 프로젝트 팀원들 간의 채팅 가능
- 사용자 개인정보 관리
<br>

## start
`node index.js`
