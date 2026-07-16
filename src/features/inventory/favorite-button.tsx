import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { setFavoriteArtifactAction } from "@/features/inventory/actions";

const favoriteFormAction = setFavoriteArtifactAction as unknown as (formData: FormData) => Promise<void>;

export function FavoriteButton({ itemId, isFavorite, disabled }: Readonly<{ itemId: string; isFavorite: boolean; disabled?: boolean }>) {
  return (
    <form action={favoriteFormAction}>
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="favorite" value={String(!isFavorite)} />
      <Button disabled={disabled} type="submit" variant={isFavorite ? "default" : "outline"} size="sm">
        <Star className={isFavorite ? "h-4 w-4 fill-current" : "h-4 w-4"} aria-hidden="true" />
        {isFavorite ? "Favorited" : "Favorite"}
      </Button>
    </form>
  );
}
