import Link from "next/link"
import { PageTitle } from "@/components/ui"

const NotFound = () => (
  <>
    <PageTitle kicker="404">ページが見つかりません</PageTitle>
    <Link href="/">トップへ戻る</Link>
  </>
)
export default NotFound
