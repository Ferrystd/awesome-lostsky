<?php
declare(strict_types=1);

namespace app\service;

use app\model\BenefitPackage;
use app\model\TeamProduct;
use think\exception\HttpException;

class Storefront
{
    public function home(int $teamId): array
    {
        $profile = app(Display::class)->profile($teamId);
        $profile['product_count'] = app(ShopAvailability::class)->open($teamId)
            ? TeamProduct::where('team_id', $teamId)
            ->where('is_active', 1)
            ->count()
            : 0;

        return $profile;
    }

    public function products(int $teamId, int $page = 1, int $limit = 20): array
    {
        [$page, $limit] = app(Pagination::class)->normalize($page, $limit);
        if (!app(ShopAvailability::class)->open($teamId)) {
            return ['total' => 0, 'list' => [], 'page' => $page, 'limit' => $limit];
        }
        $query = TeamProduct::where('team_id', $teamId)->where('is_active', 1);
        $paginator = $query->order('id', 'desc')->paginate(['list_rows' => $limit, 'page' => $page]);
        $total = $paginator->total();
        $rows = $paginator->getCollection();
        $page = $paginator->currentPage();
        $limit = $paginator->listRows();
        $list = array_map(fn (TeamProduct $product): array => $this->productData($product, false), $rows->all());

        return compact('total', 'list', 'page', 'limit');
    }

    public function product(int $teamId, int $id): array
    {
        app(ShopAvailability::class)->assertOpen($teamId);
        $product = TeamProduct::where('team_id', $teamId)
            ->where('is_active', 1)
            ->with(['handlers.subject.profile'])
            ->find($id);
        if (!$product) {
            throw new HttpException(404, '商品不存在或已下架');
        }

        return $this->productData($product, true);
    }

    private function productData(TeamProduct $product, bool $detail): array
    {
        $data = [
            'id' => (int) $product->id,
            'name' => (string) $product->name,
            'description' => $product->description ?: null,
            'cover_image' => $product->cover_image ?: null,
            'price' => (string) $product->price,
        ];
        if (!$detail) {
            return $data;
        }

        $handlers = [];
        foreach ($product->handlers ?? [] as $handler) {
            $subject = $handler->subject;
            if (!$subject || !$subject->is_valid) {
                continue;
            }
            $handlers[] = [
                'entity_id' => (int) $subject->id,
                'slug' => (string) $subject->slug,
                'name' => (string) ($subject->profile?->name ?: $subject->slug),
                'avatar' => $subject->profile?->avatar ?: null,
            ];
        }

        $data['introduction_markdown'] = $product->introduction_markdown ?: null;
        $data['handlers'] = $handlers;
        $packageId = (int) ($product->benefit_package_id ?? 0);
        $package = $packageId > 0
            ? BenefitPackage::where('issuer_team_id', (int) $product->team_id)
                ->with(['services.service'])
                ->find($packageId)
            : null;
        $data['benefit_package'] = $package ? [
            'name' => (string) $package->name,
            'services' => array_values(array_filter(array_map(
                static function ($item): ?array {
                    $service = $item->service;
                    if (!$service) return null;
                    return [
                        'id' => (int) $service->id,
                        'name' => (string) $service->name,
                        'description' => $service->description ?: null,
                        'quantity' => (string) $item->quantity,
                        'unit_name' => (string) $service->unit_name,
                        'quantity_step' => (string) $service->quantity_step,
                        'valid_days' => (int) $item->valid_days,
                    ];
                },
                ($package->services ?? collect())->all()
            ))),
        ] : null;
        return $data;
    }
}
