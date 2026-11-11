import { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  DigestPage,
  digestMetadata,
  findPeriod,
  periods,
} from "@/components/digest-page"

type Props = { params: Promise<{ week: string }> }

export const generateStaticParams = () =>
  periods.weeks.map((p) => ({ week: p.key }))
export const dynamicParams = false

const find = async (params: Props["params"]) =>
  findPeriod("week", (await params).week) ?? notFound()

export const generateMetadata = async ({ params }: Props): Promise<Metadata> =>
  digestMetadata(await find(params))

const Page = async ({ params }: Props) => (
  <DigestPage period={await find(params)} />
)
export default Page
