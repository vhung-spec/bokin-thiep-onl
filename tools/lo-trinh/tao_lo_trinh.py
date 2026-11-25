#!/usr/bin/env python3
"""
Tạo CUNG ĐƯỜNG CỐ ĐỊNH cho đoàn xe đón dâu (không đổi theo tình trạng tắc đường).

Chạy:  python3 tools/lo-trinh/tao_lo_trinh.py
Ghi ra:
  lich-trinh/lo-trinh-co-dinh.geojson  đường kẻ hai lượt + các điểm mốc (trang lich-trinh/ vẽ lên bản đồ)
  lich-trinh/lo-trinh-di.gpx, lo-trinh-ve.gpx  cho ứng dụng dẫn đường theo file (OsmAnd, Vietmap…)

Tuyến tính bằng OSRM (dữ liệu OpenStreetMap) với các điểm bắt buộc đi qua và hướng đi
tại mỗi điểm (để không bị bắt sang làn ngược chiều, gây quay đầu). Sau khi chạy, script
in ra tên các đoạn đường để kiểm tra: phải là Quốc lộ 5 → cầu Thanh Trì → Vành đai 3 trên cao → Nguyễn Trãi – Trần Phú – Vạn Phúc (không đi Tố Hữu).
"""
import json, os, sys, urllib.request
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'lich-trinh')

# Toạ độ ghim nhà trai / nhà gái: đọc từ lich-trinh/lich-trinh.json → diaDiemChung (chỉ sửa ghim ở đó)
def _ghim(key):
    with open(os.path.join(OUT, 'lich-trinh.json'), encoding='utf-8') as f:
        la, lo = json.load(f)['diaDiemChung'][key]['toaDo'].split(',')
    return (float(la), float(lo))


NHA_TRAI = _ghim('nhaTrai')   # Phố Văn, Tuệ Tĩnh, Hải Phòng (đang là ghim khu, chờ điểm lên xe chính xác)
NHA_GAI = _ghim('nhaGai')     # Trung tâm ngoại ngữ STEN, Ngọc Trục, Đại Mỗ

# Điểm bắt buộc đi qua: (vĩ độ, kinh độ, hướng đi độ, sai số độ)
LUOT = {
    'lo-trinh-di': [NHA_TRAI,
                    (20.9323078, 106.0617733, 280, 60),  # QL5 đoạn Mỹ Hào (Nguyễn Văn Linh), hướng Hà Nội
                    (20.9860400, 105.9786744, 315, 60),  # QL5 qua Như Quỳnh
                    (20.98327, 105.79151, 235, 50),      # Trần Phú (đầu Nguyễn Trãi), hướng Hà Đông
                    (20.97809, 105.78498, 235, 50),      # Trần Phú đoạn Mộ Lao
                    (20.97886, 105.77322, 340, 60),      # Vạn Phúc, đi thẳng về Đại Mỗ (không đi Tố Hữu)
                    NHA_GAI],
    'lo-trinh-ve': [NHA_GAI,
                    (20.97886, 105.77322, 180, 60),      # Vạn Phúc, đi thẳng qua ngã tư Tố Hữu ra Trần Phú
                    (20.97809, 105.78498, 55, 50),       # Trần Phú đoạn Mộ Lao
                    (20.98327, 105.79151, 55, 50),       # Trần Phú → Nguyễn Trãi
                    (20.97157, 105.82196, 120, 60),      # Vành đai 3 trên cao đoạn Linh Đàm
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
        ('road:Lối xuống Nguyễn Trãi', 'Lối xuống Nguyễn Trãi', 'Xuống đường trên cao, rẽ trái vào Nguyễn Trãi, đi thẳng Trần Phú'),
        ('road:Phố Chu Văn An', 'Rẽ phải vào Chu Văn An', 'Đi thẳng Vạn Phúc – Đại Mỗ (qua ngã tư Tố Hữu)'),
        ('end', 'Nhà gái — STEN', 'Đến nơi'),
    ],
    'lo-trinh-ve': [
        ('start', 'Nhà gái — STEN', 'Xuất phát'),
        ('road:Đường Trần Phú', 'Vào Trần Phú', 'Đi thẳng Vạn Phúc qua ngã tư Tố Hữu, ra Trần Phú – Nguyễn Trãi'),
        ('onramp', 'Lên Vành đai 3 trên cao', 'Ở ngã tư Nguyễn Trãi – Khuất Duy Tiến, theo lối lên CT.37'),
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
            'properties': {'luot': key, 'loai': 'tuyen', 'km': round(route['distance'] / 1000, 1),
                           'phut': round(route['duration'] / 60)}}
    # Đoạn Vành đai 3 trên cao (kể cả lối lên / xuống): trang dùng để nhắc GPS có thể lẫn với đường dưới thấp
    elev = []
    for s in steps:
        name, ref = s.get('name') or '', s.get('ref') or ''
        if ('Vành đai 3' in name or 'CT.37' in ref or name.startswith('Lối xuống')
                or s['maneuver']['type'] in ('on ramp', 'off ramp') and 'CT.37' in (s.get('destinations') or '') + ref):
            g = [[r5(x), r5(y)] for x, y in s['geometry']['coordinates']]
            if len(g) > 1:
                elev.append(g)
    tren_cao = {'type': 'Feature', 'geometry': {'type': 'MultiLineString', 'coordinates': elev},
                'properties': {'luot': key, 'loai': 'tren-cao'}}
    for m in marks:
        m['properties']['loai'] = 'moc'
    return feat, marks, line, tren_cao


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
        feat, marks, line, tren_cao = build(key, osrm(pts))
        feats += [feat, tren_cao] + marks
        with open(os.path.join(OUT, key.replace('lo-trinh-', 'lo-trinh-') + '.gpx'), 'w', encoding='utf-8') as f:
            f.write(gpx(key, titles[key], line, marks))
    data = {'type': 'FeatureCollection',
            'properties': {'taoLuc': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
                           'nguon': 'OSRM / © OpenStreetMap contributors'},
            'features': feats}
    with open(os.path.join(OUT, 'lo-trinh-co-dinh.geojson'), 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    print('\nĐã ghi lich-trinh/lo-trinh-co-dinh.geojson, lo-trinh-di.gpx, lo-trinh-ve.gpx')
    print('Nhắc: mở trang lich-trinh/, xem đoạn nối từ ghim nhà trai ra Quốc lộ 5 trên cả hai bản đồ trước khi gửi cho đoàn xe.')


if __name__ == '__main__':
    main()
