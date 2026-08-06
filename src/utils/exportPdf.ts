// ================================
// 导出 PDF 工具 - 基于 jsPDF + html2canvas
// 支持导出整个行程 / 订单台账 为 PDF
// ================================
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { formatDateCN, formatNZD } from '@/utils'

/**
 * 将指定 DOM 元素导出为 PDF（A4 纵向）
 * @param elementId 要导出的 DOM ID
 * @param filename  文件名（不含后缀）
 */
export const exportElementToPDF = async (
  elementId: string,
  filename = '新西兰旅行规划'
): Promise<boolean> => {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error('[PDF] 找不到元素:', elementId)
    return false
  }
  try {
    // 渲染 canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      // 忽略打印时不想要的元素
      ignoreElements: (el) => (el as HTMLElement).classList?.contains('no-print') ?? false,
    })
    const imgData = canvas.toDataURL('image/jpeg', 0.92)
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pageWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    // 多页处理
    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }
    pdf.save(`${filename}_${Date.now()}.pdf`)
    return true
  } catch (e) {
    console.error('[PDF] 导出失败:', e)
    return false
  }
}

/**
 * 快速导出：生成包含行程总览 + 订单 + 注意事项的综合 PDF
 * 策略：临时创建一个聚合 DOM，截图后再销毁
 */
export const exportFullTripPDF = async (
  tripInfo: {
    tripName: string
    dateRange: string
    days: number
  },
  daySchedules: { date: string; items: unknown[] }[],
  orders: { title: string; category: string; status: string; dateTime: string; price: number }[],
  notices: { title: string; content: string }[],
  filename: string = '新西兰旅行规划'
): Promise<boolean> => {
  // 创建临时 DOM
  const temp = document.createElement('div')
  temp.id = 'temp-pdf-export'
  temp.style.position = 'absolute'
  temp.style.left = '-9999px'
  temp.style.top = '0'
  temp.style.width = '794px' // A4 宽度 px (~210mm @96dpi)
  temp.style.background = 'white'
  temp.style.padding = '40px'
  temp.style.color = '#1f2937'
  temp.style.fontFamily = '"Noto Sans SC", "PingFang SC", sans-serif'
  temp.style.lineHeight = '1.6'

  // 标题
  temp.innerHTML = `
    <div style="border-bottom:3px solid #22c55e;padding-bottom:20px;margin-bottom:24px;">
      <h1 style="font-size:28px;margin:0 0 8px 0;color:#166534;">🇳🇿 ${tripInfo.tripName}</h1>
      <p style="margin:4px 0;color:#6b7280;font-size:14px;">📅 ${tripInfo.dateRange} · 共 ${tripInfo.days} 天</p>
      <p style="margin:4px 0;color:#9ca3af;font-size:12px;">导出时间：${new Date().toLocaleString('zh-CN')}</p>
    </div>
  `

  // ---- 行程部分 ----
  const schedDiv = document.createElement('div')
  schedDiv.innerHTML = '<h2 style="color:#0ea5e9;font-size:18px;border-left:4px solid #0ea5e9;padding-left:10px;">🗺️ 每日行程安排</h2>'
  daySchedules.forEach((ds, idx) => {
    const dayDiv = document.createElement('div')
    dayDiv.style.cssText = 'margin:16px 0;padding:14px;border:1px solid #e5e7eb;border-radius:10px;background:#f8fafc;'
    dayDiv.innerHTML = `
      <div style="font-weight:600;color:#1e293b;">Day ${idx + 1} · ${formatDateCN(ds.date)}</div>
      <div style="font-size:13px;color:#6b7280;margin-top:6px;">
        ${ds.items.length ? '' : '<span style="color:#9ca3af;">暂无安排</span>'}
      </div>
    `
    const items = ds.items as { timeStart: string; timeEnd: string; location: string; transport: string; dining: string; notes: string }[]
    items.forEach((it) => {
      const itemDiv = document.createElement('div')
      itemDiv.style.cssText = 'margin-top:10px;padding:10px;background:white;border-radius:8px;font-size:13px;'
      itemDiv.innerHTML = `
        <div style="color:#22c55e;font-weight:600;">⏰ ${it.timeStart} - ${it.timeEnd}</div>
        <div style="margin-top:4px;"><strong>📍 ${it.location || '未填写'}</strong></div>
        ${it.transport ? `<div style="color:#475569;margin-top:2px;">🚗 ${it.transport}</div>` : ''}
        ${it.dining ? `<div style="color:#475569;margin-top:2px;">🍽️ ${it.dining}</div>` : ''}
        ${it.notes ? `<div style="color:#64748b;margin-top:4px;padding:4px 8px;background:#fefce8;border-radius:4px;">📝 ${it.notes}</div>` : ''}
      `
      dayDiv.appendChild(itemDiv)
    })
    schedDiv.appendChild(dayDiv)
  })
  temp.appendChild(schedDiv)

  // ---- 订单部分 ----
  const orderDiv = document.createElement('div')
  orderDiv.style.marginTop = '28px'
  orderDiv.innerHTML = '<h2 style="color:#f97316;font-size:18px;border-left:4px solid #f97316;padding-left:10px;">🎫 订票台账</h2>'
  if (orders.length === 0) {
    orderDiv.innerHTML += '<p style="color:#9ca3af;font-size:13px;padding:14px;border:1px dashed #e5e7eb;border-radius:8px;">暂无订单记录</p>'
  } else {
    let total = 0
    const table = document.createElement('table')
    table.style.cssText = 'width:100%;border-collapse:collapse;margin-top:12px;font-size:13px;'
    table.innerHTML = `
      <thead>
        <tr style="background:#fff7ed;">
          <th style="padding:8px 10px;border:1px solid #fed7aa;text-align:left;">分类</th>
          <th style="padding:8px 10px;border:1px solid #fed7aa;text-align:left;">标题</th>
          <th style="padding:8px 10px;border:1px solid #fed7aa;text-align:left;">时间</th>
          <th style="padding:8px 10px;border:1px solid #fed7aa;text-align:left;">状态</th>
          <th style="padding:8px 10px;border:1px solid #fed7aa;text-align:right;">价格</th>
        </tr>
      </thead>
    `
    const tbody = document.createElement('tbody')
    orders.forEach((o) => {
      total += o.price || 0
      const tr = document.createElement('tr')
      tr.innerHTML = `
        <td style="padding:6px 10px;border:1px solid #fde68a;">${o.category}</td>
        <td style="padding:6px 10px;border:1px solid #fde68a;">${o.title}</td>
        <td style="padding:6px 10px;border:1px solid #fde68a;">${o.dateTime || '-'}</td>
        <td style="padding:6px 10px;border:1px solid #fde68a;">${o.status}</td>
        <td style="padding:6px 10px;border:1px solid #fde68a;text-align:right;">${formatNZD(o.price || 0)}</td>
      `
      tbody.appendChild(tr)
    })
    table.appendChild(tbody)
    orderDiv.appendChild(table)
    const totalDiv = document.createElement('div')
    totalDiv.style.cssText = 'margin-top:10px;text-align:right;font-weight:600;color:#c2410c;'
    totalDiv.textContent = `💰 订单合计：${formatNZD(total)}`
    orderDiv.appendChild(totalDiv)
  }
  temp.appendChild(orderDiv)

  // ---- 注意事项部分 ----
  const noticeDiv = document.createElement('div')
  noticeDiv.style.marginTop = '28px'
  noticeDiv.innerHTML = '<h2 style="color:#dc2626;font-size:18px;border-left:4px solid #dc2626;padding-left:10px;">⚠️ 出行注意事项</h2>'
  notices.forEach((n) => {
    const item = document.createElement('div')
    item.style.cssText = 'margin:10px 0;padding:12px;background:#fef2f2;border-radius:8px;font-size:13px;'
    item.innerHTML = `<div style="font-weight:600;color:#991b1b;margin-bottom:6px;">${n.title}</div>
      <div style="color:#4b5563;white-space:pre-line;">${n.content || '暂无内容'}</div>`
    noticeDiv.appendChild(item)
  })
  temp.appendChild(noticeDiv)

  document.body.appendChild(temp)
  try {
    const ok = await exportElementToPDF('temp-pdf-export', filename)
    return ok
  } finally {
    document.body.removeChild(temp)
  }
}
