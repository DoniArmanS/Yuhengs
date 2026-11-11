import { redirect } from "next/navigation";
import { Suspense } from "react";

export default function WatchFirstEpisode(props: PageProps<"/watch/[id]">) {
  return (
    <Suspense>
      <Redirect params={props.params} />
    </Suspense>
  );
}

async function Redirect({ params }: Pick<PageProps<"/watch/[id]">, "params">): Promise<never> {
  const { id } = await params;
  redirect(`/watch/${id}/1`);
}
