(function () {
    'use strict';

    function initBuhangaDashboard() {
        if (!window.odoo || !window.odoo.loader || !window.odoo.loader.modules || !window.odoo.loader.modules.has('@web/core/registry')) {
            setTimeout(initBuhangaDashboard, 20);
            return;
        }

        try {
            const registry = odoo.loader.modules.get('@web/core/registry').registry;
            const owl = odoo.loader.modules.get('@odoo/owl') || globalThis.owl;
            const { Component, useState, onWillStart, xml } = owl;
            const { useService } = odoo.loader.modules.get('@web/core/utils/hooks');
            const { _t } = odoo.loader.modules.get('@web/core/l10n/translation');

            class BuhangaDashboard extends Component {
                static template = xml`
                    <div class="buhanga_dashboard_wrapper p-3 bg-light min-vh-100">
                        <!-- Top Bar -->
                        <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 pb-2 border-bottom">
                            <div class="d-flex align-items-center gap-2">
                                <div class="rounded-3 p-2 bg-primary-subtle text-primary shadow-sm">
                                    <i class="fa fa-tachometer fa-lg"></i>
                                </div>
                                <div>
                                    <h4 class="mb-0 fw-bold text-dark">Front Desk Dashboard</h4>
                                    <div class="text-muted small">Buhanga Eco Lodge - Rooms &amp; Reservations Overview</div>
                                </div>
                            </div>
                            <div class="d-flex align-items-center gap-2">
                                <button class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 shadow-sm bg-white" t-on-click="() =&gt; this.toggleSidebar()" title="Toggle Sidebar">
                                    <i t-attf-class="fa #{state.showSidebar ? 'fa-columns text-primary' : 'fa-columns text-muted'}"></i>
                                    <span class="small fw-semibold d-none d-md-inline"><t t-esc="state.showSidebar ? 'Hide Panel' : 'Show Panel'"/></span>
                                </button>
                                <button class="btn btn-sm btn-primary d-flex align-items-center gap-1 shadow-sm" t-on-click="() =&gt; this.reloadDashboard()" title="Refresh">
                                    <i class="fa fa-refresh"></i>
                                    <span class="small fw-semibold">Refresh</span>
                                </button>
                            </div>
                        </div>

                        <!-- 4 KPI Gradient Stat Cards -->
                        <div class="row g-3 mb-3">
                            <div class="col-xl-3 col-md-6 cursor-pointer" t-on-click="() =&gt; this.openBookedRooms()">
                                <div class="buhanga-kpi-card card-gradient-1 p-3 rounded-3 shadow-sm text-white">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <div class="kpi-label small text-white-50 fw-bold text-uppercase">Bookings to Confirm</div>
                                            <div class="kpi-subtext small text-white-70 mt-1">Total Booked &amp; Reserved</div>
                                        </div>
                                        <span class="badge rounded-pill bg-warning text-dark px-3 py-2 fw-bolder fs-5 shadow-sm">
                                            <t t-esc="state.kpis.total_booked || 0"/>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div class="col-xl-3 col-md-6 cursor-pointer" t-on-click="() =&gt; this.openCheckInToday()">
                                <div class="buhanga-kpi-card card-gradient-2 p-3 rounded-3 shadow-sm text-white">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <div class="kpi-label small text-white-50 fw-bold text-uppercase">Check-in Requests</div>
                                            <div class="kpi-subtext small text-white-70 mt-1">Scheduled for Arrival</div>
                                        </div>
                                        <span class="badge rounded-pill bg-warning text-dark px-3 py-2 fw-bolder fs-5 shadow-sm">
                                            <t t-esc="state.kpis.check_in_request || 0"/>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div class="col-xl-3 col-md-6 cursor-pointer" t-on-click="() =&gt; this.openCheckOutToday()">
                                <div class="buhanga-kpi-card card-gradient-3 p-3 rounded-3 shadow-sm text-white">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <div class="kpi-label small text-white-50 fw-bold text-uppercase">Check-out Requests</div>
                                            <div class="kpi-subtext small text-white-70 mt-1">Scheduled for Departure</div>
                                        </div>
                                        <span class="badge rounded-pill bg-warning text-dark px-3 py-2 fw-bolder fs-5 shadow-sm">
                                            <t t-esc="state.kpis.check_out_request || 0"/>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div class="col-xl-3 col-md-6 cursor-pointer" t-on-click="() =&gt; this.openAvailableRooms()">
                                <div class="buhanga-kpi-card card-gradient-4 p-3 rounded-3 shadow-sm text-white">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <div class="kpi-label small text-white-50 fw-bold text-uppercase">Total Available</div>
                                            <div class="kpi-subtext small text-white-70 mt-1">Rooms Ready for Booking</div>
                                        </div>
                                        <span class="badge rounded-pill bg-warning text-dark px-3 py-2 fw-bolder fs-5 shadow-sm">
                                            <t t-esc="state.kpis.total_available || 0"/>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Main Content Grid -->
                        <div class="row g-3">
                            <div t-attf-class="#{state.showSidebar ? 'col-lg-9 col-md-8' : 'col-12'}">
                                <!-- Navigation & Filter Controls -->
                                <div class="card shadow-sm border-0 mb-3 bg-white">
                                    <div class="card-body py-2 px-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
                                        <div class="d-flex align-items-center gap-2">
                                            <div class="btn-group btn-group-sm">
                                                <button class="btn btn-outline-secondary" t-on-click="() =&gt; this.navigatePrev()" title="Previous">&lt;</button>
                                                <button class="btn btn-outline-secondary fw-semibold" t-on-click="() =&gt; this.navigateToday()">Today</button>
                                                <button class="btn btn-outline-secondary" t-on-click="() =&gt; this.navigateNext()" title="Next">&gt;</button>
                                            </div>
                                            <div class="btn-group btn-group-sm">
                                                <button t-attf-class="btn #{state.viewMode == 'week' ? 'btn-primary fw-bold' : 'btn-outline-secondary'}" t-on-click="() =&gt; this.setViewMode('week')">Week</button>
                                                <button t-attf-class="btn #{state.viewMode == 'month' ? 'btn-primary fw-bold' : 'btn-outline-secondary'}" t-on-click="() =&gt; this.setViewMode('month')">Month</button>
                                            </div>
                                            <span class="fw-bold fs-6 text-dark ms-2">
                                                <t t-esc="state.dateRangeLabel"/>
                                            </span>
                                            <t t-if="state.selectedDate">
                                                <span class="badge bg-warning text-dark border border-warning ms-2 d-flex align-items-center gap-1">
                                                    <span>Focused: <t t-esc="state.selectedDate"/></span>
                                                    <i class="fa fa-times cursor-pointer ms-1" t-on-click="() =&gt; this.clearSelectedDate()" title="Clear Focus"></i>
                                                </span>
                                            </t>
                                        </div>

                                        <div class="d-flex align-items-center gap-2">
                                            <label class="fw-semibold text-secondary small mb-0">
                                                <i class="fa fa-filter text-primary me-1"></i>Room Type:
                                            </label>
                                            <select class="form-select form-select-sm fw-bold border-primary text-dark" style="min-width: 170px;" t-on-change="(e) =&gt; this.onRoomTypeChange(e)">
                                                <option value="all" t-att-selected="state.selectedRoomType == 'all'">All Room Types (<t t-esc="state.rooms.length"/>)</option>
                                                <t t-foreach="state.allRoomTypes" t-as="rt" t-key="rt">
                                                    <option t-att-value="rt" t-att-selected="state.selectedRoomType == rt"><t t-esc="rt"/></option>
                                                </t>
                                            </select>
                                            <span class="badge bg-light text-dark border fw-bold">
                                                <t t-esc="state.filteredRooms.length"/> Rooms
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Timeline Table -->
                                <div class="table-responsive bg-white border rounded-3 shadow-sm timeline-scroll-container">
                                    <table class="table table-bordered mb-0 timeline-table align-middle">
                                        <thead class="table-light sticky-top">
                                            <tr>
                                                <th style="width: 250px; min-width: 230px;" class="fw-bold bg-light ps-3">
                                                    Hotel Rooms (<t t-esc="state.filteredRooms.length"/>)
                                                </th>
                                                <t t-foreach="state.days" t-as="day" t-key="day.date">
                                                    <th t-att-id="'timeline-th-' + day.date"
                                                        t-attf-class="text-center p-2 #{day.date == state.selectedDate ? 'bg-warning text-dark fw-bolder border border-2 border-warning' : (day.isToday ? 'bg-primary text-white' : 'bg-light')}"
                                                        style="min-width: 95px; cursor: pointer;"
                                                        t-on-click="() =&gt; this.onMiniCalDateClick(day.date)">
                                                        <div class="small text-uppercase fw-semibold"><t t-esc="day.dayName"/></div>
                                                        <div class="fw-bold fs-6"><t t-esc="day.dayNumber"/></div>
                                                    </th>
                                                </t>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <t t-if="state.filteredRooms.length == 0">
                                                <tr>
                                                    <td t-att-colspan="state.days.length + 1" class="text-center py-5 text-muted">
                                                        <i class="fa fa-bed fa-2x mb-2 d-block opacity-50"></i>
                                                        No rooms found for this room category.
                                                    </td>
                                                </tr>
                                            </t>
                                            <t t-foreach="state.filteredRooms" t-as="room" t-key="room.id">
                                                <tr>
                                                    <!-- Room Name Column: Full name, No awkward badge box -->
                                                    <td class="fw-bold ps-3 bg-white" style="width: 250px; min-width: 230px;">
                                                        <div class="d-flex align-items-center text-dark text-truncate" t-att-title="room.name">
                                                            <i class="fa fa-bed me-2 text-primary" style="font-size: 14px;"></i>
                                                            <span class="fs-6 fw-bold"><t t-esc="room.name"/></span>
                                                        </div>
                                                    </td>

                                                    <t t-foreach="state.days" t-as="day" t-key="day.date">
                                                        <td t-attf-class="timeline-cell text-center p-1 #{day.date == state.selectedDate ? 'col-selected-date' : (day.isToday ? 'bg-primary-subtle' : '')}"
                                                            t-on-click="(e) =&gt; this.onCellClick(room, day, e)">
                                                            
                                                            <t t-set="dayBooking" t-value="this.getBookingForRoomAndDay(room.id, day.date)"/>
                                                            <t t-if="dayBooking">
                                                                <div t-attf-class="booking-pill py-1 px-2 rounded-2 text-truncate fw-bold shadow-sm"
                                                                     t-attf-style="background-color: #{this.getBookingColor(dayBooking)}; color: #{this.getBookingTextColor(dayBooking)}; cursor: pointer;"
                                                                     t-att-title="dayBooking.name + ' - ' + dayBooking.partner_name + ' (' + dayBooking.state_label + ')'"
                                                                     t-on-click.stop="() =&gt; this.openBooking(dayBooking.booking_id)">
                                                                    <t t-esc="dayBooking.name"/> <small class="opacity-80">(<t t-esc="dayBooking.partner_name"/>)</small>
                                                                </div>
                                                            </t>

                                                            <t t-set="isCleaning" t-value="this.isRoomCleaning(room.id)"/>
                                                            <t t-if="!dayBooking and isCleaning and day.isToday">
                                                                <span class="badge text-dark bg-light border border-secondary fw-bold" style="background-color: #ced6e0 !important;">Cleaning</span>
                                                            </t>

                                                            <t t-set="isMaint" t-value="this.isRoomMaintenance(room.id)"/>
                                                            <t t-if="!dayBooking and isMaint and day.isToday">
                                                                <span class="badge text-white fw-bold" style="background-color: #8854d0;">Maintenance</span>
                                                            </t>
                                                        </td>
                                                    </t>
                                                </tr>
                                            </t>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <!-- Right-Side Panel -->
                            <div t-if="state.showSidebar" class="col-lg-3 col-md-4">
                                <!-- Mini Month Calendar with Booked Date Dots -->
                                <div class="card shadow-sm border-0 mb-3 bg-white rounded-3">
                                    <div class="card-body p-3">
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <button class="btn btn-sm btn-link text-dark p-0 fw-bold" t-on-click="() =&gt; this.navigateMiniCalPrev()">&lt;</button>
                                            <strong class="text-dark small fs-6"><t t-esc="this.miniCalMonthLabel"/></strong>
                                            <button class="btn btn-sm btn-link text-dark p-0 fw-bold" t-on-click="() =&gt; this.navigateMiniCalNext()">&gt;</button>
                                        </div>
                                        <div class="row g-0 text-center small text-muted fw-bold mb-1" style="font-size: 11px;">
                                            <div class="col" style="width: 14.28%; flex: 0 0 14.28%; max-width: 14.28%;">S</div>
                                            <div class="col" style="width: 14.28%; flex: 0 0 14.28%; max-width: 14.28%;">M</div>
                                            <div class="col" style="width: 14.28%; flex: 0 0 14.28%; max-width: 14.28%;">T</div>
                                            <div class="col" style="width: 14.28%; flex: 0 0 14.28%; max-width: 14.28%;">W</div>
                                            <div class="col" style="width: 14.28%; flex: 0 0 14.28%; max-width: 14.28%;">T</div>
                                            <div class="col" style="width: 14.28%; flex: 0 0 14.28%; max-width: 14.28%;">F</div>
                                            <div class="col" style="width: 14.28%; flex: 0 0 14.28%; max-width: 14.28%;">S</div>
                                        </div>
                                        <div class="row g-1 text-center" style="font-size: 12px;">
                                            <t t-foreach="this.miniCalDays" t-as="mday" t-key="mday.key">
                                                <div class="col" style="width: 14.28%; flex: 0 0 14.28%; max-width: 14.28%;">
                                                    <div t-if="mday.dayNumber"
                                                         t-attf-class="mini-cal-day position-relative d-flex flex-column align-items-center justify-content-center rounded-2 #{mday.isToday ? 'bg-primary text-white fw-bold shadow-sm' : (mday.isSelected ? 'border border-2 border-warning fw-bold text-dark bg-warning-subtle' : 'text-dark')}"
                                                         t-att-title="mday.tooltip"
                                                         t-on-click="() =&gt; this.onMiniCalDateClick(mday.dateStr)">
                                                        <span><t t-esc="mday.dayNumber"/></span>
                                                        <t t-if="mday.hasBookings">
                                                            <span class="cal-booked-dot" t-attf-style="background-color: #{mday.dotColor};"></span>
                                                        </t>
                                                    </div>
                                                </div>
                                            </t>
                                        </div>
                                    </div>
                                </div>

                                <!-- Booking Legends: High Contrast, Full Statuses including Cancelled -->
                                <div class="card shadow-sm border-0 mb-3 bg-white rounded-3">
                                    <div class="card-body p-3">
                                        <h6 class="fw-bold text-dark mb-3" style="font-size: 13px;">
                                            <i class="fa fa-info-circle text-primary me-1"></i> Booking Legends
                                        </h6>
                                        <div class="d-flex flex-column gap-2" style="font-size: 13px;">
                                            <div class="d-flex align-items-center gap-2">
                                                <span class="legend-dot" style="background-color: #ffa502;"></span>
                                                <span class="fw-bold text-dark">Draft / Booking</span>
                                            </div>
                                            <div class="d-flex align-items-center gap-2">
                                                <span class="legend-dot" style="background-color: #0984e3;"></span>
                                                <span class="fw-bold text-dark">Confirmed / Reserved</span>
                                            </div>
                                            <div class="d-flex align-items-center gap-2">
                                                <span class="legend-dot" style="background-color: #2ed573;"></span>
                                                <span class="fw-bold text-dark">Checked-In</span>
                                            </div>
                                            <div class="d-flex align-items-center gap-2">
                                                <span class="legend-dot" style="background-color: #2f3542;"></span>
                                                <span class="fw-bold text-dark">Checked-Out</span>
                                            </div>
                                            <div class="d-flex align-items-center justify-content-between buhanga-legend-clickable" t-on-click="() =&gt; this.openCancelledBookings()" title="Click to view all Cancelled Reservations">
                                                <div class="d-flex align-items-center gap-2">
                                                    <span class="legend-dot" style="background-color: #ff4757;"></span>
                                                    <span class="fw-bold text-dark">Cancelled</span>
                                                </div>
                                                <span class="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-2 py-0" style="font-size: 10px;">
                                                    Audit <i class="fa fa-arrow-right ms-1" style="font-size: 9px;"></i>
                                                </span>
                                            </div>
                                            <div class="d-flex align-items-center gap-2">
                                                <span class="legend-dot" style="background-color: #8854d0;"></span>
                                                <span class="fw-bold text-dark">Maintenance</span>
                                            </div>
                                            <div class="d-flex align-items-center gap-2">
                                                <span class="legend-dot" style="background-color: #a4b0be;"></span>
                                                <span class="fw-bold text-dark">Cleaning</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- In-House / Checked-in Guests List (Date Synced) -->
                                <div class="card shadow-sm border-0 bg-white rounded-3">
                                    <div class="card-header bg-white py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
                                        <strong class="text-dark small">
                                            <i class="fa fa-users text-primary me-1"></i>
                                            <t t-if="state.selectedDate">Guests on <t t-esc="state.selectedDate"/></t>
                                            <t t-else="">In-House Guests</t>
                                        </strong>
                                        <span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill">
                                            <t t-esc="this.filteredGuests.length"/>
                                        </span>
                                    </div>
                                    <div class="card-body p-2">
                                        <div class="input-group input-group-sm mb-2">
                                            <span class="input-group-text bg-light border-end-0"><i class="fa fa-search text-muted"></i></span>
                                            <input type="text" class="form-control form-control-sm border-start-0" placeholder="Filter guests..." t-on-input="(e) =&gt; this.onGuestSearchInput(e)"/>
                                        </div>

                                        <div class="guest-list-container" style="max-height: 280px; overflow-y: auto;">
                                            <t t-if="this.filteredGuests.length == 0">
                                                <div class="text-center py-3 text-muted small">
                                                    No guests found for this selection.
                                                </div>
                                            </t>
                                            <t t-foreach="this.filteredGuests" t-as="g" t-key="g.booking_id">
                                                <div class="p-2 mb-1 border rounded-2 bg-light guest-item-card cursor-pointer" t-on-click="() =&gt; this.openBooking(g.booking_id)">
                                                    <div class="d-flex justify-content-between align-items-start">
                                                        <strong class="text-dark small"><t t-esc="g.partner_name"/></strong>
                                                        <span class="badge text-white fw-bold shadow-sm"
                                                              t-attf-style="background-color: #{this.getBookingColor(g)}; color: #{this.getBookingTextColor(g)}; font-size: 10px;">
                                                            <t t-esc="g.state == 'check_in' ? 'Checked-In' : (g.state == 'reserved' ? 'Reserved' : (g.state == 'draft' ? 'Draft' : (g.state == 'check_out' ? 'Checked-Out' : g.state)))"/>
                                                        </span>
                                                    </div>
                                                    <div class="text-muted small mt-1" style="font-size: 11px;">
                                                        <i class="fa fa-bed me-1 text-primary"></i><t t-esc="g.room_name"/>
                                                    </div>
                                                    <div class="text-secondary" style="font-size: 10px;">
                                                        Stay: <t t-esc="g.checkin_date"/> to <t t-esc="g.checkout_date"/>
                                                    </div>
                                                </div>
                                            </t>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                static props = ["*"];

                setup() {
                    this.action = useService("action");
                    this.orm = useService("orm");
                    const today = new Date();
                    this.state = useState({
                        currentDate: today,
                        miniCalDate: today,
                        selectedDate: null,
                        viewMode: 'month',
                        selectedRoomType: 'all',
                        allRoomTypes: [],
                        rooms: [],
                        filteredRooms: [],
                        dateRangeLabel: '',
                        days: [],
                        bookings: [],
                        cleaning: [],
                        maintenance: [],
                        checkedInGuests: [],
                        searchGuestQuery: '',
                        showSidebar: true,
                        kpis: {
                            check_in_request: 0,
                            check_out_request: 0,
                            total_available: 0,
                            total_booked: 0,
                        }
                    });

                    onWillStart(async () => {
                        await this.loadTimeline();
                    });
                }

                getBookingColor(booking) {
                    if (!booking) return '#0984e3';
                    switch (booking.state) {
                        case 'draft':
                            return '#ffa502'; // Amber / Gold for Draft Booking
                        case 'reserved':
                            return '#0984e3'; // Crisp Royal Blue for Confirmed / Reserved
                        case 'check_in':
                            return '#2ed573'; // Emerald Green for In-House / Checked-In
                        case 'check_out':
                            return '#2f3542'; // Slate Charcoal for Checked-Out
                        case 'cancel':
                            return '#ff4757'; // Vivid Crimson Red for Cancelled
                        default:
                            return booking.color || '#0984e3';
                    }
                }

                getBookingTextColor(booking) {
                    if (booking && booking.state === 'draft') return '#1a1a1a';
                    return '#ffffff';
                }

                formatDateISO(d) {
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                }

                async loadTimeline() {
                    const curr = new Date(this.state.currentDate);
                    let start, end;
                    if (this.state.viewMode === 'week') {
                        const dayOfWeek = curr.getDay();
                        const diffToMonday = curr.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                        start = new Date(curr.setDate(diffToMonday));
                        end = new Date(start);
                        end.setDate(start.getDate() + 6);
                    } else {
                        start = new Date(curr.getFullYear(), curr.getMonth(), 1);
                        end = new Date(curr.getFullYear(), curr.getMonth() + 1, 0);
                    }

                    const startStr = this.formatDateISO(start);
                    const endStr = this.formatDateISO(end);
                    const days = [];
                    const iter = new Date(start);
                    const todayStr = this.formatDateISO(new Date());

                    while (iter <= end) {
                        const dateStr = this.formatDateISO(iter);
                        days.push({
                            date: dateStr,
                            dayNumber: iter.getDate(),
                            dayName: iter.toLocaleDateString('en-US', { weekday: 'short' }),
                            isToday: dateStr === todayStr,
                        });
                        iter.setDate(iter.getDate() + 1);
                    }
                    this.state.days = days;
                    this.state.dateRangeLabel = `${start.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`;

                    const result = await this.orm.call('room.booking', 'get_dashboard_timeline_data', [], {
                        start_date: startStr,
                        end_date: endStr,
                    });

                    this.state.kpis = result.kpis || {};
                    this.state.bookings = result.bookings || [];
                    this.state.cleaning = result.cleaning || [];
                    this.state.maintenance = result.maintenance || [];

                    // Deduplicate rooms by name
                    const rawRooms = result.rooms || [];
                    const seenNames = new Set();
                    const uniqueRooms = [];
                    for (const r of rawRooms) {
                        if (!seenNames.has(r.name)) {
                            seenNames.add(r.name);
                            uniqueRooms.push(r);
                        }
                    }
                    this.state.rooms = uniqueRooms;

                    const typesSet = new Set();
                    for (const r of this.state.rooms) {
                        if (r.room_type) {
                            typesSet.add(r.room_type);
                        }
                    }
                    this.state.allRoomTypes = Array.from(typesSet);
                    this.filterRooms();

                    // Populate checked in & active guests
                    const inHouse = [];
                    for (const b of this.state.bookings) {
                        if (b.state === 'check_in' || b.state === 'reserved' || b.state === 'draft') {
                            inHouse.push({
                                booking_id: b.booking_id,
                                name: b.name,
                                partner_name: b.partner_name || 'Guest',
                                room_name: b.room_name || 'Room',
                                checkin_date: b.checkin_date || '',
                                checkout_date: b.checkout_date || '',
                                state: b.state
                            });
                        }
                    }
                    this.state.checkedInGuests = inHouse;
                }

                onRoomTypeChange(e) {
                    this.state.selectedRoomType = e.target.value;
                    this.filterRooms();
                }

                filterRooms() {
                    if (this.state.selectedRoomType === 'all') {
                        this.state.filteredRooms = this.state.rooms;
                    } else {
                        this.state.filteredRooms = this.state.rooms.filter(r => r.room_type === this.state.selectedRoomType);
                    }
                }

                getBookingForRoomAndDay(roomId, dateStr) {
                    return this.state.bookings.find(b => b.room_id === roomId && b.checkin_date <= dateStr && b.checkout_date >= dateStr);
                }

                isRoomCleaning(roomId) {
                    return this.state.cleaning.some(c => c.room_id === roomId);
                }

                isRoomMaintenance(roomId) {
                    return this.state.maintenance.some(m => m.room_id === roomId);
                }

                async navigateToday() {
                    this.state.currentDate = new Date();
                    this.state.miniCalDate = new Date();
                    this.state.selectedDate = this.formatDateISO(new Date());
                    await this.loadTimeline();
                    this.scrollToDate(this.state.selectedDate);
                }

                async navigatePrev() {
                    const d = new Date(this.state.currentDate);
                    if (this.state.viewMode === 'week') {
                        d.setDate(d.getDate() - 7);
                    } else {
                        d.setMonth(d.getMonth() - 1);
                    }
                    this.state.currentDate = d;
                    this.state.miniCalDate = new Date(d);
                    await this.loadTimeline();
                }

                async navigateNext() {
                    const d = new Date(this.state.currentDate);
                    if (this.state.viewMode === 'week') {
                        d.setDate(d.getDate() + 7);
                    } else {
                        d.setMonth(d.getMonth() + 1);
                    }
                    this.state.currentDate = d;
                    this.state.miniCalDate = new Date(d);
                    await this.loadTimeline();
                }

                async setViewMode(mode) {
                    this.state.viewMode = mode;
                    await this.loadTimeline();
                }

                async reloadDashboard() {
                    await this.loadTimeline();
                }

                toggleSidebar() {
                    this.state.showSidebar = !this.state.showSidebar;
                }

                onGuestSearchInput(e) {
                    this.state.searchGuestQuery = (e.target.value || '').toLowerCase();
                }

                clearSelectedDate() {
                    this.state.selectedDate = null;
                }

                get filteredGuests() {
                    let list = this.state.checkedInGuests || [];
                    if (this.state.selectedDate) {
                        const sDate = this.state.selectedDate;
                        const onDay = list.filter(g => g.checkin_date <= sDate && g.checkout_date >= sDate);
                        if (onDay.length > 0) {
                            list = onDay;
                        }
                    }
                    const q = this.state.searchGuestQuery;
                    if (!q) return list;
                    return list.filter(g =>
                        (g.partner_name && g.partner_name.toLowerCase().includes(q)) ||
                        (g.room_name && g.room_name.toLowerCase().includes(q)) ||
                        (g.name && g.name.toLowerCase().includes(q))
                    );
                }

                get miniCalMonthLabel() {
                    const d = this.state.miniCalDate || new Date();
                    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                }

                navigateMiniCalPrev() {
                    const d = new Date(this.state.miniCalDate);
                    d.setMonth(d.getMonth() - 1);
                    this.state.miniCalDate = d;
                }

                navigateMiniCalNext() {
                    const d = new Date(this.state.miniCalDate);
                    d.setMonth(d.getMonth() + 1);
                    this.state.miniCalDate = d;
                }

                scrollToDate(dateStr) {
                    setTimeout(() => {
                        const el = document.getElementById('timeline-th-' + dateStr);
                        if (el) {
                            el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                        }
                    }, 80);
                }

                async onMiniCalDateClick(dateStr) {
                    if (!dateStr) return;
                    this.state.selectedDate = dateStr;
                    const clickedDate = new Date(dateStr + 'T00:00:00');

                    // If week mode, center week on clicked date
                    if (this.state.viewMode === 'week') {
                        this.state.currentDate = clickedDate;
                        await this.loadTimeline();
                    } else {
                        // Month mode: check if month changed
                        if (clickedDate.getMonth() !== this.state.currentDate.getMonth() || clickedDate.getFullYear() !== this.state.currentDate.getFullYear()) {
                            this.state.currentDate = clickedDate;
                            await this.loadTimeline();
                        }
                    }
                    this.scrollToDate(dateStr);
                }

                getBookingsForDate(dateStr) {
                    return (this.state.bookings || []).filter(b => b.checkin_date <= dateStr && b.checkout_date >= dateStr);
                }

                get miniCalDays() {
                    const d = this.state.miniCalDate || new Date();
                    const year = d.getFullYear();
                    const month = d.getMonth();
                    const firstDay = new Date(year, month, 1).getDay();
                    const totalDays = new Date(year, month + 1, 0).getDate();
                    const todayStr = this.formatDateISO(new Date());

                    const days = [];
                    for (let i = 0; i < firstDay; i++) {
                        days.push({ key: 'empty-' + i, dayNumber: null });
                    }
                    for (let day = 1; day <= totalDays; day++) {
                        const m = String(month + 1).padStart(2, '0');
                        const dd = String(day).padStart(2, '0');
                        const dateStr = `${year}-${m}-${dd}`;

                        const dayBookings = this.getBookingsForDate(dateStr);
                        const hasBookings = dayBookings.length > 0;
                        let dotColor = null;
                        let tooltip = dateStr;

                        if (hasBookings) {
                            if (dayBookings.some(b => b.state === 'check_in')) {
                                dotColor = '#2ed573'; // Green for checked-in
                            } else if (dayBookings.some(b => b.state === 'reserved')) {
                                dotColor = '#0984e3'; // Blue for reserved
                            } else if (dayBookings.some(b => b.state === 'draft')) {
                                dotColor = '#ffa502'; // Gold for draft
                            } else {
                                dotColor = '#2f3542';
                            }
                            const guestNames = dayBookings.map(b => b.partner_name || b.name).join(', ');
                            tooltip = `${dateStr} (${dayBookings.length} Booked: ${guestNames})`;
                        }

                        days.push({
                            key: 'day-' + day,
                            dayNumber: day,
                            dateStr: dateStr,
                            isToday: dateStr === todayStr,
                            isSelected: dateStr === this.state.selectedDate,
                            hasBookings: hasBookings,
                            dotColor: dotColor,
                            tooltip: tooltip
                        });
                    }
                    return days;
                }

                openBooking(bookingId) {
                    this.action.doAction({
                        name: _t("Room Booking"),
                        type: 'ir.actions.act_window',
                        res_model: 'room.booking',
                        res_id: bookingId,
                        views: [[false, 'form']],
                        target: 'current'
                    });
                }

                onCellClick(room, day, e) {
                    const existing = this.getBookingForRoomAndDay(room.id, day.date);
                    if (existing) {
                        this.openBooking(existing.booking_id);
                    } else {
                        this.action.doAction({
                            name: _t("New Booking"),
                            type: 'ir.actions.act_window',
                            res_model: 'room.booking',
                            views: [[false, 'form']],
                            context: {
                                'default_room_line_ids': [{
                                    'room_id': room.id,
                                    'checkin_date': `${day.date} 14:00:00`,
                                    'checkout_date': `${day.date} 11:00:00`,
                                }]
                            },
                            target: 'current'
                        });
                    }
                }

                openCheckInToday() {
                    this.action.doAction({
                        name: _t("Check-In Requests Today"),
                        type: 'ir.actions.act_window',
                        res_model: 'room.booking',
                        view_mode: 'list,form',
                        views: [[false, 'list'], [false, 'form']],
                        domain: [['state', 'in', ['draft', 'reserved', 'check_in']]],
                        target: 'current'
                    });
                }

                openCheckOutToday() {
                    this.action.doAction({
                        name: _t("Check-Out Requests Today"),
                        type: 'ir.actions.act_window',
                        res_model: 'room.booking',
                        view_mode: 'list,form',
                        views: [[false, 'list'], [false, 'form']],
                        domain: [['state', 'in', ['check_in', 'check_out']]],
                        target: 'current'
                    });
                }

                openAvailableRooms() {
                    this.action.doAction({
                        name: _t("Available Rooms"),
                        type: 'ir.actions.act_window',
                        res_model: 'product.template',
                        view_mode: 'list,form',
                        views: [[false, 'list'], [false, 'form']],
                        domain: [['is_room', '=', true], ['status', '=', 'available']],
                        target: 'current'
                    });
                }

                openBookedRooms() {
                    this.action.doAction({
                        name: _t("Booked Rooms"),
                        type: 'ir.actions.act_window',
                        res_model: 'product.template',
                        view_mode: 'list,form',
                        views: [[false, 'list'], [false, 'form']],
                        domain: [['is_room', '=', true], ['status', 'in', ['reserved', 'occupied']]],
                        target: 'current'
                    });
                }

                openCancelledBookings() {
                    this.action.doAction({
                        name: _t("Cancelled Reservations"),
                        type: 'ir.actions.act_window',
                        res_model: 'room.booking',
                        view_mode: 'list,form',
                        views: [[false, 'list'], [false, 'form']],
                        domain: [['state', '=', 'cancel']],
                        context: {
                            'search_default_state_cancel': 1
                        },
                        target: 'current'
                    });
                }
            }

            registry.category("actions").add("custom_dashboard_tags", BuhangaDashboard, { force: true });
            console.log("%c[Buhanga Eco Lodge] Front Desk Dashboard initialized successfully!", "background: #1a4d2e; color: #fff; padding: 4px 8px; border-radius: 4px; font-weight: bold;");

            // Auto-refresh if old view is active
            setTimeout(() => {
                try {
                    if (document.querySelector('.hotel_dashboard_container')) {
                        const rootEnv = window.odoo?.__WOWL_DEBUG__?.root?.env;
                        if (rootEnv && rootEnv.services && rootEnv.services.action) {
                            console.log("[Buhanga Eco Lodge] Auto-refreshing dashboard view...");
                            rootEnv.services.action.doAction('custom_dashboard_tags', { clearBreadcrumbs: true });
                        }
                    }
                } catch (e) {
                    console.warn("[Buhanga] Auto-refresh check ignored:", e);
                }
            }, 300);

        } catch (e) {
            console.error("[Buhanga] Initialization error:", e);
            setTimeout(initBuhangaDashboard, 50);
        }
    }

    initBuhangaDashboard();
})();