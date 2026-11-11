import { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  DigestPage,
  digestMetadata,
  findPeriod,
  periods,
} from "@/components/digest-page"

type Props = { params: Promise<{ month: string }> }

export const generateStaticParams = () =>
  periods.months.map((p) => ({ month: p.key }))
export const dynamicParams = false

const find = async (params: Props["params"]) =>
  findPeriod("month", (await params).month) ?? notFound()

export const generateMetadata = async ({ params }: Props): Promise<Metadata> =>
  digestMetadata(await find(params))

const Page = async ({ params }: Props) => (
  <DigestPage period={await find(params)} />
)
export default Page
