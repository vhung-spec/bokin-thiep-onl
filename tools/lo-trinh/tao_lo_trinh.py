#!/usr/bin/env python3
"""
Tạo CUNG ĐƯỜNG CỐ ĐỊNH cho đoàn xe đón dâu (không đổi theo tình trạng tắc đường).

Chạy:  python3 tools/lo-trinh/tao_lo_trinh.py
Ghi ra:
  lich-trinh/lo-trinh-co-dinh.geojson  đường kẻ hai lượt + các điểm mốc (trang lich-trinh/ vẽ lên bản đồ)
  lich-trinh/lo-trinh-di.gpx, lo-trinh-ve.gpx  cho ứng dụng dẫn đường theo file (OsmAnd, Vietmap…)

Tuyến tính bằng OSRM (dữ liệu OpenStreetMap) với các điểm bắt buộc đi qua và hướng đi
tại mỗi điểm (để không bị bắt sang làn ngược chiều, gây quay đầu). Sau khi chạy, script
in ra tên các đoạn đường để kiểm tra: phải là Quốc lộ 5 → cầu Thanh Trì → Vành đai 3 trên cao.
"""
import json, os, sys, urllib.request
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'lich-trinh')

# Toạ độ ghim Google Maps chủ thiệp gửi (vĩ độ, kinh độ)
NHA_TRAI = (20.9577131, 106.2765173)   # Phố Văn, Tuệ Tĩnh, Hải Phòng
NHA_GAI = (20.9882994, 105.7731068)    # Trung tâm ngoại ngữ STEN, Ngọc Trục, Đại Mỗ

# Điểm bắt buộc đi qua: (vĩ độ, kinh độ, hướng đi độ, sai số độ)
LUOT = {
    'lo-trinh-di': [NHA_TRAI,
                    (20.9323078, 106.0617733, 280, 60),  # QL5 đoạn Mỹ Hào (Nguyễn Văn Linh), hướng Hà Nội
                    (20.9860400, 105.9786744, 315, 60),  # QL5 qua Như Quỳnh
                    NHA_GAI],
    'lo-trinh-ve': [NHA_GAI,
                    (20.9920240, 105.7852400, 55, 45),   # Tố Hữu, hướng Khuất Duy Tiến (đi ngược lượt đi)
                    (20.9860400, 105.9786744, 135, 60),  # QL5 qua Như Quỳnh, hướng Hải Phòng
                    (20.9323078, 106.0617733, 100, 60),  # QL5 đoạn Mỹ Hào
                    NHA_TRAI],
}

# Điểm mốc hiện trên bản đồ: tìm theo tên đoạn đường / kiểu rẽ trong kết quả OSRM
MOC = {
    'lo-trinh-di': [
        ('start', 'Nhà trai — Phố Văn', 'Xuất phát'),
        ('road:Quốc lộ 5', 'Vào Quốc lộ 5', 'Rẽ phải vào QL5, đi hướng Hà Nội'),
        ('road:Cầu vượt Quốc lộ 5', 'Lên cầu vượt QL5', 'Đi làn phải, lên cầu vượt hướng cầu Thanh Trì'),
        ('point:20.99456,105.90257', 'Cầu Thanh Trì', 'Qua cầu, đi thẳng lên Vành đai 3 trên cao'),
        ('road:Lối xuống Nguyễn Trãi', 'Lối xuống Nguyễn Trãi', 'Xuống đường trên cao, đi thẳng Khuất Duy Tiến'),
        ('road:Phố Tố Hữu', 'Rẽ trái vào Tố Hữu', 'Đi Tố Hữu khoảng 3,4 km'),
        ('end', 'Nhà gái — STEN', 'Đến nơi'),
    ],
    'lo-trinh-ve': [
        ('start', 'Nhà gái — STEN', 'Xuất phát'),
        ('road:Phố Tố Hữu', 'Rẽ trái vào Tố Hữu', 'Đi Tố Hữu về Khuất Duy Tiến'),
        ('onramp', 'Lên Vành đai 3 trên cao', 'Theo lối lên CT.37, hướng Pháp Vân – cầu Thanh Trì'),
        ('point:20.99456,105.90257', 'Cầu Thanh Trì', 'Qua cầu, đi tiếp tới nút giao QL5'),
        ('road:Đường Nguyễn Đức Thuận', 'Vào Quốc lộ 5', 'Đi QL5 hướng Hải Phòng'),
        ('road_last:Quốc lộ 5', 'Rời Quốc lộ 5', 'Rẽ trái vào đường về Phố Văn'),
        ('end', 'Nhà trai — Phố Văn', 'Đến nơi'),
    ],
}


def osrm(points):
    coords = ';'.join(f'{p[1]},{p[0]}' for p in points)
    bear = ';'.join(f'{p[2]},{p[3]}' if len(p) > 2 else '' for p in points)
    url = (f'https://router.project-osrm.org/route/v1/driving/{coords}'
           f'?overview=full&geometries=geojson&steps=true&bearings={bear}')
    req = urllib.request.Request(url, headers={'User-Agent': 'thiep-cuoi-lo-trinh/1.0'})
    d = json.load(urllib.request.urlopen(req, timeout=90))
    if d.get('code') != 'Ok':
        sys.exit(f'OSRM lỗi: {d}')
    return d['routes'][0]


def r5(x):
    return round(x, 5)


def build(key, route):
    steps = [s for leg in route['legs'] for s in leg['steps']]
    uturns = [s for s in steps if s['maneuver'].get('modifier') == 'uturn']
    if uturns:
        sys.exit(f'{key}: có quay đầu tại {[s["maneuver"]["location"] for s in uturns]} — chỉnh lại điểm đi qua')
    line = [[r5(x), r5(y)] for x, y in route['geometry']['coordinates']]
    marks = []
    for i, (rule, name, note) in enumerate(MOC[key]):
        loc = None
        if rule == 'start':
            loc = line[0]
        elif rule == 'end':
            loc = line[-1]
        elif rule == 'onramp':
            loc = next(s['maneuver']['location'] for s in steps if s['maneuver']['type'] == 'on ramp')
        elif rule.startswith('road:'):
            loc = next(s['maneuver']['location'] for s in steps if s.get('name') == rule[5:])
        elif rule.startswith('road_last:'):
            idx = max(i for i, s in enumerate(steps) if s.get('name') == rule[10:])
            loc = steps[idx + 1]['maneuver']['location']
        elif rule.startswith('point:'):
            la, lo = map(float, rule[6:].split(','))
            loc = min(line, key=lambda c: (c[0] - lo) ** 2 + (c[1] - la) ** 2)
        marks.append({'type': 'Feature', 'geometry': {'type': 'Point', 'coordinates': [r5(loc[0]), r5(loc[1])]},
                      'properties': {'luot': key, 'stt': i + 1, 'ten': name, 'ghiChu': note}})
    print(f'\n{key}: {route["distance"]/1000:.1f} km, ~{route["duration"]/60:.0f} phút khi đường thoáng')
    prev = None
    for s in steps:
        n = (s.get('name') or '') + (f' [{s["ref"]}]' if s.get('ref') else '')
        if n != prev and s['distance'] > 250:
            print(f'  {s["distance"]/1000:5.1f} km  {n}')
        prev = n
    feat = {'type': 'Feature', 'geometry': {'type': 'LineString', 'coordinates': line},
            'properties': {'luot': key, 'km': round(route['distance'] / 1000, 1),
                           'phut': round(route['duration'] / 60)}}
    return feat, marks, line


def gpx(key, title, line, marks):
    pts = '\n'.join(f'      <trkpt lat="{c[1]}" lon="{c[0]}"/>' for c in line)
    wpts = '\n'.join(f'  <wpt lat="{m["geometry"]["coordinates"][1]}" lon="{m["geometry"]["coordinates"][0]}">'
                     f'<name>{m["properties"]["stt"]}. {m["properties"]["ten"]}</name>'
                     f'<desc>{m["properties"]["ghiChu"]}</desc></wpt>' for m in marks)
    return (f'<?xml version="1.0" encoding="UTF-8"?>\n'
            f'<gpx version="1.1" creator="thiep-cuoi lich-trinh" xmlns="http://www.topografix.com/GPX/1/1">\n'
            f'  <metadata><name>{title}</name></metadata>\n{wpts}\n'
            f'  <trk><name>{title}</name><trkseg>\n{pts}\n  </trkseg></trk>\n</gpx>\n')


def main():
    feats = []
    titles = {'lo-trinh-di': 'Lượt đi: Nhà trai → Nhà gái (QL5 · Vành đai 3 trên cao)',
              'lo-trinh-ve': 'Lượt về: Nhà gái → Nhà trai (Vành đai 3 trên cao · QL5)'}
    for key, pts in LUOT.items():
        feat, marks, line = build(key, osrm(pts))
        feats += [feat] + marks
        with open(os.path.join(OUT, key.replace('lo-trinh-', 'lo-trinh-') + '.gpx'), 'w', encoding='utf-8') as f:
            f.write(gpx(key, titles[key], line, marks))
    data = {'type': 'FeatureCollection',
            'properties': {'taoLuc': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
                           'nguon': 'OSRM / © OpenStreetMap contributors'},
            'features': feats}
    with open(os.path.join(OUT, 'lo-trinh-co-dinh.geojson'), 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    print('\nĐã ghi lich-trinh/lo-trinh-co-dinh.geojson, lo-trinh-di.gpx, lo-trinh-ve.gpx')


if __name__ == '__main__':
    main()
