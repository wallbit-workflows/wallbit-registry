import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { RegistryHome } from "@/components/registry-home";
import { listWorkflows } from "@/lib/api";
import type { ListItem } from "@/lib/types";

export default async function Home() {
  let items: ListItem[] = [];
  try {
    const data = await listWorkflows(50, 0);
    items = data.items;
  } catch {
    items = [];
  }

  return (
    <>
      <SiteHeader />
      <main>
        <RegistryHome items={items} />
      </main>
      <SiteFooter />
    </>
  );
}
