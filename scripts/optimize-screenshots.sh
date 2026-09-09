#!/usr/bin/env bash
#
# 스크린샷 원본을 배포용 WebP 두 벌로 변환한다.
#
#   assets-src/screenshots/*.png   (원본, 저장소에 보관)
#     -> public/images/projects/thumb/*.webp   높이 480  = 갤러리 표시 높이 240 의 2배
#     -> public/images/projects/large/*.webp   가로 1920 = 라이트박스 전체화면용
#
# 변환 결과(WebP)는 저장소에 커밋되므로 클론 직후 바로 빌드된다.
# 이 스크립트는 스크린샷을 추가하거나 크기·품질을 바꿀 때만 실행하면 되고,
# 원본 PNG 는 저장소에 없으므로 백업에서 assets-src/screenshots/ 로 복사해 두어야 한다.
#
# 사용법:
#   ./scripts/optimize-screenshots.sh           변경된 것만 변환
#   ./scripts/optimize-screenshots.sh --force   전체 재변환
#
# 필요 도구: cwebp  (brew install webp)
#
# 참고 — 데모 영상은 별도로 아래 명령으로 변환했다 (brew install ffmpeg):
#   ffmpeg -i assets-src/video/tms_dnd.mov -vf scale=1920:-2 \
#          -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p \
#          -movflags +faststart -an public/images/projects/tms_dnd.mp4

set -euo pipefail

FORCE=0
[ "${1:-}" = "--force" ] && FORCE=1

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/assets-src/screenshots"
OUT="$ROOT/public/images/projects"

# 갤러리는 높이 240 으로 표시하므로 2배인 480 이면 레티나에서도 충분하다.
THUMB_HEIGHT=480
# 라이트박스는 거의 전체화면이라 가로 1920 을 기준으로 둔다.
LARGE_WIDTH=1920
# 스크린샷은 글자가 많아 -sharp_yuv 로 가장자리 색 번짐을 줄인다.
THUMB_Q=82
LARGE_Q=88

if ! command -v cwebp >/dev/null 2>&1; then
  echo "cwebp 가 없습니다. 설치 후 다시 실행하세요:" >&2
  echo "  brew install webp" >&2
  exit 1
fi

if [ ! -d "$SRC" ]; then
  echo "원본 디렉터리가 없습니다: $SRC" >&2
  exit 1
fi

shopt -s nullglob
sources=("$SRC"/*.png)
if [ ${#sources[@]} -eq 0 ]; then
  echo "변환할 PNG 가 없습니다: $SRC" >&2
  exit 1
fi

mkdir -p "$OUT/thumb" "$OUT/large"

converted=0
skipped=0

for src in "${sources[@]}"; do
  name="$(basename "$src" .png)"
  thumb="$OUT/thumb/$name.webp"
  large="$OUT/large/$name.webp"

  # 원본이 산출물보다 오래됐고 강제 옵션도 없으면 건너뛴다
  if [ $FORCE -eq 0 ] && [ -f "$thumb" ] && [ -f "$large" ] \
     && [ ! "$src" -nt "$thumb" ] && [ ! "$src" -nt "$large" ]; then
    skipped=$((skipped + 1))
    continue
  fi

  # `file` 출력에서 "<가로> x <세로>" 를 뽑는다 (sips 의존 없이 리눅스에서도 동작)
  dims="$(file -b "$src" | grep -oE '[0-9]+ x [0-9]+' | head -1)"
  w="${dims% x *}"
  h="${dims#* x }"
  if [ -z "$w" ] || [ -z "$h" ]; then
    echo "  ! 크기를 읽지 못해 건너뜁니다: $name.png" >&2
    continue
  fi

  # 원본보다 크게 늘리지 않는다
  th=$THUMB_HEIGHT; [ "$h" -lt "$THUMB_HEIGHT" ] && th=$h
  tw=$LARGE_WIDTH;  [ "$w" -lt "$LARGE_WIDTH" ]  && tw=$w

  cwebp -quiet -q $THUMB_Q -m 6 -sharp_yuv -alpha_q 100 -resize 0 "$th" "$src" -o "$thumb"
  cwebp -quiet -q $LARGE_Q -m 6 -sharp_yuv -alpha_q 100 -resize "$tw" 0 "$src" -o "$large"
  converted=$((converted + 1))
  printf '  %-40s %sx%s\n' "$name" "$w" "$h"
done

# du 는 디스크 블록 할당량이라 재작성 직후 값이 튄다. 실제 바이트를 센다.
total_bytes() {
  find "$1" -name '*.webp' -exec cat {} + | wc -c | tr -d ' '
}

echo
echo "변환 $converted 개, 건너뜀 $skipped 개"
printf '  %-38s %6.2f MB\n' "public/images/projects/thumb" \
  "$(echo "$(total_bytes "$OUT/thumb")" | awk '{print $1/1048576}')"
printf '  %-38s %6.2f MB\n' "public/images/projects/large" \
  "$(echo "$(total_bytes "$OUT/large")" | awk '{print $1/1048576}')"
