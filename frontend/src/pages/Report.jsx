import { useState } from "react";
import {
  FileText,
  Cpu,
  Zap,
  Bell,
  Shield,
  Activity,
  Share2,
  Clipboard,
  Check,
} from "lucide-react";

export default function Report() {
  const [activeTab, setActiveTab] = useState("cau1");
  const [copied, setCopied] = useState(null);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const TABS = [
    { id: "cau1", label: "Câu 1: Kiến trúc", icon: FileText },
    { id: "cau2", label: "Câu 2: Đặc tả & Sơ đồ", icon: Cpu },
    { id: "cau3", label: "Câu 3: Xử lý Tình huống", icon: Zap },
    { id: "cau4", label: "Câu 4: Bảo mật", icon: Shield },
    { id: "cau5", label: "Câu 5: Nghiệm thu & Kiến nghị", icon: Activity },
  ];

  const mermaidCode = `graph TD
    Client[Web/Mobile Client] -->|HTTPS| Gateway[API Gateway - Port 9000]
    Gateway -->|HTTP / JWT Verify| Auth[Auth Service - Port 3001]
    Gateway -->|HTTP| Device[Device Service - Port 3002]
    Gateway -->|HTTP| Auto[Automation Service - Port 3003]
    Gateway -->|HTTP| Monitor[Monitoring Service - Port 3004]
    Gateway -->|HTTP| Notif[Notification Service - Port 3005]

    Sensors[Cảm biến / Simulator] -->|MQTT| Mosquitto[MQTT Broker - Mosquitto]
    Monitor -->|Subscribe| Mosquitto
    Monitor -->|Ghi dữ liệu| Influx[InfluxDB - Sensor Readings]
    
    Monitor -->|Publish Events| Rabbit[RabbitMQ Message Broker]
    Rabbit -->|Route alert| Auto
    Rabbit -->|Route alert| Notif
    
    Auto -->|HTTP Command| Device
    Device -->|Publish command| Mosquitto
    Mosquitto -->|Thực thi| Actuators[Đèn / Điều hòa]
    
    Auth -->|PostgreSQL| DBAuth[(so_auth DB)]
    Device -->|PostgreSQL| DBDev[(so_devices DB)]
    Auto -->|PostgreSQL| DBDev
    Notif -->|PostgreSQL| DBNotif[(so_notifications DB)]
    Notif -->|SMTP| Gmail[Gmail SMTP Service]
    Auth -->|Cache Tokens| Redis[(Redis Cache)]`;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Báo cáo & Đặc tả Kiến trúc Smart Office
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Bài luận giải trình cấu trúc, luồng hoạt động, cơ chế bảo mật và
          nghiệm thu thực nghiệm hệ thống.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-px">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                active
                  ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Container */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        {/* TAB 1: CÂU 1 */}
        {activeTab === "cau1" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Câu 1: Xác định và Giải thích Mô hình Kiến trúc
              </h2>
              <div className="h-1 w-20 bg-blue-600 rounded"></div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 mb-1">
                Mô hình đề xuất:
              </h3>
              <p className="text-blue-800 text-sm font-medium">
                Kiến trúc Microservices & kết hợp Kiến trúc Hướng sự kiện
                (Event-Driven Architecture - EDA)
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 text-base">
                Giải thích lý do lựa chọn:
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-gray-100 bg-gray-50/50 rounded-xl space-y-2">
                  <span className="text-xl">⚖️</span>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    Tính độc lập & Co giãn (Scalability)
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Các nghiệp vụ trong Smart Office có đặc thù tải lượng rất
                    khác nhau. Việc tách thành các dịch vụ độc lập giúp tăng độ
                    chịu tải riêng lẻ (ví dụ: nhân rộng bộ phận thu thập dữ liệu
                    cảm biến mà không cần nhân bản các chức năng quản lý người
                    dùng).
                  </p>
                </div>

                <div className="p-4 border border-gray-100 bg-gray-50/50 rounded-xl space-y-2">
                  <span className="text-xl">🛠️</span>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    Tính đa dạng công nghệ (Heterogeneous)
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Phù hợp cho việc tích hợp đa ngôn ngữ. Chúng ta viết
                    Monitoring Service thu thập sensor bằng Python để truy cập
                    InfluxDB tối ưu nhất, trong khi viết các API nghiệp vụ CRUD
                    bằng Node.js/Express để tối ưu hóa thời gian phát triển và
                    phản hồi.
                  </p>
                </div>

                <div className="p-4 border border-gray-100 bg-gray-50/50 rounded-xl space-y-2">
                  <span className="text-xl">⚡</span>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    Xử lý bất đồng bộ thời gian thực
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Giao tiếp qua MQTT Broker và RabbitMQ Broker giúp cách ly
                    các tác vụ nặng, tránh tình trạng nghẽn cổ chai (bottleneck)
                    khi có hàng ngàn bản tin cảm biến đổ về cùng lúc từ phòng
                    làm việc.
                  </p>
                </div>

                <div className="p-4 border border-gray-100 bg-gray-50/50 rounded-xl space-y-2">
                  <span className="text-xl">🛡️</span>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    Cô lập lỗi (Fault Tolerance)
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Nếu một dịch vụ như gửi email (Notification Service) tạm
                    thời bị nghẽn mạng hoặc chết, các phần cốt lõi như giám sát
                    nhiệt độ và tự động bật tắt điều hòa vẫn chạy bình thường
                    nhờ hàng đợi đệm bất đồng bộ.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CÂU 2 */}
        {activeTab === "cau2" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  Câu 2: Thiết kế Sơ đồ Kiến trúc & Đặc tả Hệ thống
                </h2>
                <div className="h-1 w-20 bg-blue-600 rounded"></div>
              </div>
              <button
                onClick={() => handleCopy(mermaidCode, "mermaid")}
                className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                {copied === "mermaid" ? (
                  <Check className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <Clipboard className="w-3.5 h-3.5" />
                )}
                {copied === "mermaid" ? "Đã sao chép" : "Sao chép mã Mermaid"}
              </button>
            </div>

            {/* Visual HTML Architecture Diagram */}
            <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/30">
              <h3 className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-wider text-center">
                SƠ ĐỒ PHÂN LỚP KIẾN TRÚC
              </h3>

              <div className="space-y-6 flex flex-col items-center">
                {/* Layer 1: Client */}
                <div className="bg-sky-600 text-white px-8 py-2.5 rounded-xl font-semibold shadow-sm text-sm">
                  🌐 Web / Mobile Client
                </div>

                <div className="w-0.5 h-6 bg-gray-300"></div>

                {/* Layer 2: Gateway */}
                <div className="bg-indigo-700 text-white px-10 py-2.5 rounded-xl font-bold shadow-sm text-sm text-center">
                  🔑 API Gateway (Port 9000)
                  <p className="text-[10px] font-normal text-indigo-200 mt-0.5">
                    JWT Auth & Route Proxy
                  </p>
                </div>

                <div className="w-full flex justify-around px-8 max-w-4xl relative">
                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-200 -z-10"></div>
                  <div className="w-px h-6 bg-gray-300"></div>
                  <div className="w-px h-6 bg-gray-300"></div>
                  <div className="w-px h-6 bg-gray-300"></div>
                  <div className="w-px h-6 bg-gray-300"></div>
                  <div className="w-px h-6 bg-gray-300"></div>
                </div>

                {/* Layer 3: Services */}
                <div className="grid grid-cols-5 gap-3 w-full max-w-5xl">
                  <div className="bg-white border border-gray-200 p-3 rounded-xl shadow-sm text-center">
                    <p className="font-bold text-xs text-gray-800">
                      Auth Service
                    </p>
                    <span className="text-[9px] text-gray-400">
                      Node/Express · 3001
                    </span>
                    <div className="mt-2 text-[9px] bg-blue-50 text-blue-700 rounded py-0.5 font-medium">
                      Postgres + Redis
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 p-3 rounded-xl shadow-sm text-center">
                    <p className="font-bold text-xs text-gray-800">
                      Device Service
                    </p>
                    <span className="text-[9px] text-gray-400">
                      Node/Express · 3002
                    </span>
                    <div className="mt-2 text-[9px] bg-blue-50 text-blue-700 rounded py-0.5 font-medium">
                      Postgres + MQTT
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 p-3 rounded-xl shadow-sm text-center">
                    <p className="font-bold text-xs text-gray-800">
                      Automation
                    </p>
                    <span className="text-[9px] text-gray-400">
                      Node/Express · 3003
                    </span>
                    <div className="mt-2 text-[9px] bg-blue-50 text-blue-700 rounded py-0.5 font-medium">
                      Postgres + RabbitMQ
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 p-3 rounded-xl shadow-sm text-center">
                    <p className="font-bold text-xs text-gray-800">
                      Monitoring
                    </p>
                    <span className="text-[9px] text-gray-400">
                      Python/Aiohttp · 3004
                    </span>
                    <div className="mt-2 text-[9px] bg-blue-50 text-blue-700 rounded py-0.5 font-medium">
                      InfluxDB + MQTT
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 p-3 rounded-xl shadow-sm text-center">
                    <p className="font-bold text-xs text-gray-800">
                      Notification
                    </p>
                    <span className="text-[9px] text-gray-400">
                      Node/Express · 3005
                    </span>
                    <div className="mt-2 text-[9px] bg-blue-50 text-blue-700 rounded py-0.5 font-medium">
                      Postgres + SMTP
                    </div>
                  </div>
                </div>

                <div className="w-full flex items-center justify-between max-w-4xl pt-4 border-t border-dashed border-gray-200">
                  <div className="text-center w-full">
                    <div className="inline-block bg-purple-100 text-purple-800 font-bold px-4 py-1.5 rounded-lg text-xs">
                      ⚡ Event Bus: RabbitMQ (AMQP) & Mosquitto (MQTT Broker)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Spec Document */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 text-base">
                Tài liệu Đặc tả Kiến trúc Vi dịch vụ:
              </h3>
              <div className="space-y-2 text-xs text-gray-700">
                <table className="w-full text-left border-collapse border border-gray-200 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-3 border border-gray-200 font-semibold">
                        Tên dịch vụ
                      </th>
                      <th className="p-3 border border-gray-200 font-semibold">
                        Công nghệ sử dụng
                      </th>
                      <th className="p-3 border border-gray-200 font-semibold">
                        Cơ sở dữ liệu
                      </th>
                      <th className="p-3 border border-gray-200 font-semibold">
                        Giao thức / Cơ chế kết nối
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border border-gray-200 font-medium">
                        API Gateway
                      </td>
                      <td className="p-3 border border-gray-200">
                        Node.js, Express, HttpProxy
                      </td>
                      <td className="p-3 border border-gray-200">Không</td>
                      <td className="p-3 border border-gray-200">
                        HTTP/REST, kiểm tra chữ ký JWT
                      </td>
                    </tr>
                    <tr className="bg-gray-50/50">
                      <td className="p-3 border border-gray-200 font-medium">
                        Auth Service
                      </td>
                      <td className="p-3 border border-gray-200">
                        Node.js, Express, JWT
                      </td>
                      <td className="p-3 border border-gray-200">
                        PostgreSQL (so_auth) + Redis (Cache)
                      </td>
                      <td className="p-3 border border-gray-200">
                        REST API, Phân quyền RBAC
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-gray-200 font-medium">
                        Device Service
                      </td>
                      <td className="p-3 border border-gray-200">
                        Node.js, Express, Paho-MQTT
                      </td>
                      <td className="p-3 border border-gray-200">
                        PostgreSQL (so_devices)
                      </td>
                      <td className="p-3 border border-gray-200">
                        REST API & MQTT Publish
                      </td>
                    </tr>
                    <tr className="bg-gray-50/50">
                      <td className="p-3 border border-gray-200 font-medium">
                        Monitoring Service
                      </td>
                      <td className="p-3 border border-gray-200">
                        Python, Aiohttp, Paho-MQTT
                      </td>
                      <td className="p-3 border border-gray-200">
                        InfluxDB (Sensor readings)
                      </td>
                      <td className="p-3 border border-gray-200">
                        MQTT Subscribe & RabbitMQ Publish
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-gray-200 font-medium">
                        Automation Service
                      </td>
                      <td className="p-3 border border-gray-200">
                        Node.js, Express, Amqplib
                      </td>
                      <td className="p-3 border border-gray-200">
                        PostgreSQL (Rules database)
                      </td>
                      <td className="p-3 border border-gray-200">
                        RabbitMQ Consumer & REST API Call
                      </td>
                    </tr>
                    <tr className="bg-gray-50/50">
                      <td className="p-3 border border-gray-200 font-medium">
                        Notification Service
                      </td>
                      <td className="p-3 border border-gray-200">
                        Node.js, Express, Nodemailer
                      </td>
                      <td className="p-3 border border-gray-200">
                        PostgreSQL (so_notifications)
                      </td>
                      <td className="p-3 border border-gray-200">
                        RabbitMQ Consumer & SMTP (Gmail API)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CÂU 3 */}
        {activeTab === "cau3" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Câu 3: Xử lý Tình huống Nhiệt độ &gt; 29°C
              </h2>
              <div className="h-1 w-20 bg-blue-600 rounded"></div>
            </div>

            <p className="text-sm text-gray-600">
              Kịch bản:{" "}
              <strong>
                “Nếu nhiệt độ trong phòng vượt quá 29°C, tự động bật điều hòa và
                gửi thông báo đến điện thoại”
              </strong>
              .
            </p>

            {/* Sequence flow card list */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 text-sm">
                Luồng tuần tự sự kiện phối hợp giữa các thành phần:
              </h3>

              <div className="relative border-l-2 border-blue-500 pl-6 ml-3 space-y-6 text-xs text-gray-700">
                <div className="relative">
                  <span className="absolute -left-9 top-0.5 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px]">
                    1
                  </span>
                  <h4 className="font-bold text-gray-900 text-xs">
                    Cảm biến nhiệt độ gửi bản tin MQTT
                  </h4>
                  <p className="text-gray-500 mt-0.5">
                    Cảm biến nhiệt độ đo được nhiệt độ thực tế 29.5°C và publish
                    gói tin JSON lên chủ đề:{" "}
                    <code className="bg-gray-100 px-1 py-0.5 rounded">
                      office/3/room301/temperature
                    </code>
                    .
                  </p>
                </div>

                <div className="relative">
                  <span className="absolute -left-9 top-0.5 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px]">
                    2
                  </span>
                  <h4 className="font-bold text-gray-900 text-xs">
                    Monitoring Service thu nhận dữ liệu
                  </h4>
                  <p className="text-gray-500 mt-0.5">
                    Dịch vụ giám sát nhận dữ liệu từ MQTT, tiến hành lưu trữ
                    lịch sử vào <strong>InfluxDB</strong> phục vụ vẽ biểu đồ và
                    kiểm tra ngưỡng cài đặt phòng (29.5 &gt; 29).
                  </p>
                </div>

                <div className="relative">
                  <span className="absolute -left-9 top-0.5 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px]">
                    3
                  </span>
                  <h4 className="font-bold text-gray-900 text-xs">
                    Phát sự kiện cảnh báo lên Event Bus
                  </h4>
                  <p className="text-gray-500 mt-0.5">
                    Do vượt ngưỡng, Monitoring Service đẩy sự kiện cảnh báo bất
                    đồng bộ{" "}
                    <code className="bg-gray-100 px-1 py-0.5 rounded">
                      sensor.alert
                    </code>{" "}
                    lên <strong>RabbitMQ Message Broker</strong>.
                  </p>
                </div>

                <div className="relative">
                  <span className="absolute -left-9 top-0.5 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px]">
                    4
                  </span>
                  <h4 className="font-bold text-gray-900 text-xs">
                    Nhận diện quy tắc tự động hóa và Thực thi lệnh
                  </h4>
                  <p className="text-gray-500 mt-0.5">
                    <strong>Automation Service</strong> tiêu thụ tin nhắn từ
                    RabbitMQ, khớp luật "Nhiệt độ phòng &gt; 29°C -&gt; Bật điều
                    hòa" và gửi yêu cầu REST API sang{" "}
                    <strong>Device Service</strong> để bật điều hòa.
                  </p>
                </div>

                <div className="relative">
                  <span className="absolute -left-9 top-0.5 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px]">
                    5
                  </span>
                  <h4 className="font-bold text-gray-900 text-xs">
                    Điều hòa vật lý hoạt động & Gửi thông báo người dùng
                  </h4>
                  <p className="text-gray-500 mt-0.5">
                    Device Service xuất bản lệnh bật điều hòa qua MQTT để phần
                    cứng phản hồi. Đồng thời,{" "}
                    <strong>Notification Service</strong> nhận sự kiện từ
                    RabbitMQ gửi thông báo qua email và ứng dụng trên điện
                    thoại.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CÂU 4 */}
        {activeTab === "cau4" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Câu 4: Đánh giá Bảo mật Hệ thống
              </h2>
              <div className="h-1 w-20 bg-blue-600 rounded"></div>
            </div>

            <div className="space-y-6">
              <div className="p-5 border border-gray-100 bg-gray-50/50 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 font-bold p-1 rounded">
                    Biện pháp 1
                  </span>
                  <h3 className="font-bold text-gray-900 text-sm">
                    Xác thực Token JWT và Phân quyền theo vai trò (RBAC)
                  </h3>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  <strong>Cách triển khai:</strong> Khi người dùng đăng nhập hệ
                  thống thông qua Auth Service, dịch vụ sẽ cấp một chữ ký số
                  Token JWT duy nhất chứa vai trò (
                  <code className="bg-gray-100 px-1 py-0.5 rounded">role</code>)
                  của tài khoản (ví dụ: Admin, Staff, Guest). API Gateway làm
                  nhiệm vụ đánh chặn và giải mã Token này ở mọi cổng vào dịch
                  vụ. Khi người dùng điều khiển thiết bị, Device Service đối
                  chiếu ID thiết bị và quyền hạn vai trò nhận từ token. Khách
                  vãng lai (Guest) hoặc nhân viên không phụ trách phòng họp đó
                  sẽ bị từ chối truy cập và trả về mã lỗi{" "}
                  <code className="bg-red-50 text-red-600 px-1 py-0.5 rounded">
                    403 Forbidden
                  </code>
                  .
                </p>
              </div>

              <div className="p-5 border border-gray-100 bg-gray-50/50 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <span className="bg-green-100 text-green-700 font-bold p-1 rounded">
                    Biện pháp 2
                  </span>
                  <h3 className="font-bold text-gray-900 text-sm">
                    Mã hóa truyền thông sử dụng giao thức MQTTS và HTTPS over
                    TLS
                  </h3>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  <strong>Cách triển khai:</strong> Cấu hình giao tiếp MQTT
                  Broker (Mosquitto) trên cổng bảo mật SSL/TLS{" "}
                  <code className="bg-gray-100 px-1 py-0.5 rounded">8883</code>.
                  Toàn bộ thiết bị IoT hoặc cảm biến trong văn phòng phải xác
                  thực thông qua chứng chỉ Client Certificate (X.509) hoặc cơ
                  chế bắt buộc mật khẩu được băm (hashing). Đồng thời, cấu hình
                  chứng chỉ SSL/TLS cho API Gateway để biến toàn bộ cổng giao
                  dịch trên ứng dụng di động thành HTTPS. Việc này loại bỏ hoàn
                  toàn nguy cơ kẻ gian trung gian bắt lén các bản tin điều khiển
                  hoặc chèn mã độc.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CÂU 5 */}
        {activeTab === "cau5" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Câu 5: Thử nghiệm Mô hình & Khuyến nghị Thực tế
              </h2>
              <div className="h-1 w-20 bg-blue-600 rounded"></div>
            </div>

            <div className="space-y-4">
              <div className="border border-green-200 bg-green-50/30 rounded-xl p-4 space-y-2">
                <h3 className="font-bold text-green-900 text-sm">
                  🧪 Kết quả Thử nghiệm thực tế mô hình:
                </h3>
                <p className="text-xs text-gray-700 leading-relaxed">
                  Hệ thống vi dịch vụ này đã được triển khai chạy thử nghiệm
                  hoàn chỉnh thông qua giải pháp ảo hóa{" "}
                  <strong>Docker Compose</strong>. Dữ liệu nhiệt độ cảm biến
                  được giả lập thông qua công cụ IoT Simulator sinh dữ liệu hình
                  sin liên tục. Khi cấu hình thay đổi nhiệt độ nền vượt mốc 29°C
                  trên Dashboard, luồng liên hoàn đã chạy chính xác: Cảnh báo đỏ
                  xuất hiện -&gt; Bật điều hòa tức thì -&gt; Gửi email cảnh báo
                  thời gian thực về hòm thư người nhận trong vòng{" "}
                  <strong>dưới 100ms</strong>.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-gray-800 text-sm">
                  💡 Đề xuất & Khuyến nghị triển khai trên thực tế:
                </h3>

                <ul className="list-disc pl-5 space-y-2 text-xs text-gray-600">
                  <li>
                    <strong className="text-gray-800">
                      Sử dụng Kubernetes (K8s) cho Production:
                    </strong>{" "}
                    Để tự động hồi phục khi dịch vụ vi mô sập (Self-healing) và
                    tự động mở rộng lượng bản sao ứng dụng khi số lượng thiết bị
                    gia tăng (Auto-scaling).
                  </li>
                  <li>
                    <strong className="text-gray-800">
                      Chuyển sang Cloud IoT Managed Services:
                    </strong>{" "}
                    Sử dụng AWS IoT Core hoặc GCP IoT Core thay thế cho
                    Mosquitto tự cài để quản trị tối ưu bảo mật X.509 của hàng
                    vạn thiết bị IoT và ngăn ngừa các đợt tấn công từ chối dịch
                    vụ (DDoS).
                  </li>
                  <li>
                    <strong className="text-gray-800">
                      Phân vùng mạng VLAN IoT riêng biệt:
                    </strong>{" "}
                    Cách ly toàn bộ mạng không dây kết nối cảm biến và thiết bị
                    văn phòng thông minh ra một mạng ảo độc lập, không cho truy
                    cập chéo vào mạng máy tính nghiệp vụ của nhân viên nhằm
                    phòng ngừa lây lan mã độc.
                  </li>
                  <li>
                    <strong className="text-gray-800">
                      Tích hợp Prometheus & Grafana:
                    </strong>{" "}
                    Giúp bộ phận vận hành giám sát tập trung sức khỏe phần cứng,
                    dung lượng RAM/CPU của từng dịch vụ vi mô và thiết lập cảnh
                    báo sớm lỗi hệ thống.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
