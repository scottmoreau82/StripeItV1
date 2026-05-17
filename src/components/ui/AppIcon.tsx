import React from 'react';
import { 
  Home, 
  ClipboardList, 
  Activity, 
  TrendingUp, 
  Target, 
  Settings, 
  Archive, 
  Plus,
  FileText,
  MessageSquarePlus,
  Bell,
  Search,
  User,
  Lock,
  Edit,
  Trash2,
  Info,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  X,
  Check,
  AlertTriangle,
  HelpCircle,
  Menu,
  Moon,
  Sun,
  Layout,
  PieChart,
  LogOut,
  CreditCard,
  Shield,
  Building2,
  FlaskConical,
  Sparkles,
  Zap,
  Filter,
  ArrowRight,
  RefreshCw,
  MoreVertical,
  Calendar,
  Cloud,
  Download,
  Upload,
  Eye,
  EyeOff,
  Star,
  Users,
  Settings2,
  Clock,
  History,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Copy,
  PlusCircle,
  MinusCircle,
  ShieldCheck,
  Smartphone,
  Laptop,
  ChevronUp,
  Calculator,
  Layers,
  Timer,
  Badge,
  Inbox,
  Trophy,
  Circle,
  MoreHorizontal,
  CheckCircle2,
  BarChart3,
  MousePointer2,
  UserPlus,
  Car
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import * as Phosphor from '@phosphor-icons/react';
import * as Tabler from '@tabler/icons-react';
import * as HeroIcons from '@heroicons/react/24/outline';
import { useAuth } from '@/src/contexts/AuthContext';
import { IconTheme, SubscriptionTier } from '@/src/types';

/**
 * Semantic Icon Names for Stripe It
 */
export type IconName = 
  | 'dashboard'
  | 'salesLog'
  | 'activity'
  | 'analytics'
  | 'goals'
  | 'reports'
  | 'inventory'
  | 'settings'
  | 'feedback'
  | 'plus'
  | 'plusCircle'
  | 'minusCircle'
  | 'bell'
  | 'search'
  | 'user'
  | 'lock'
  | 'edit'
  | 'delete'
  | 'info'
  | 'chevronRight'
  | 'chevronLeft'
  | 'chevronDown'
  | 'chevronUp'
  | 'close'
  | 'check'
  | 'alert'
  | 'help'
  | 'menu'
  | 'moon'
  | 'sun'
  | 'layout'
  | 'pieChart'
  | 'logout'
  | 'billing'
  | 'shield'
  | 'shieldCheck'
  | 'organization'
  | 'lab'
  | 'premium'
  | 'quick'
  | 'filter'
  | 'arrowRight'
  | 'refresh'
  | 'more'
  | 'calendar'
  | 'cloud'
  | 'download'
  | 'upload'
  | 'view'
  | 'viewOff'
  | 'star'
  | 'users'
  | 'tuning'
  | 'clock'
  | 'history'
  | 'mail'
  | 'phone'
  | 'location'
  | 'external'
  | 'copy'
  | 'smartphone'
  | 'laptop'
  | 'trending'
  | 'calculator'
  | 'layers'
  | 'timer'
  | 'badge'
  | 'inbox'
  | 'trophy'
  | 'circle'
  | 'moreHorizontal'
  | 'success'
  | 'barChart'
  | 'pointer'
  | 'userPlus'
  | 'target'
  | 'logBuilder'
  | 'car';

/**
 * Themed Registry mapping semantic names to specific icon components in active packs.
 */
const themedRegistry: Record<IconTheme, Partial<Record<IconName, any>>> = {
  [IconTheme.LUCIDE]: {
    dashboard: Home,
    salesLog: ClipboardList,
    activity: Activity,
    analytics: TrendingUp,
    goals: Target,
    reports: FileText,
    inventory: Archive,
    settings: Settings,
    feedback: MessageSquarePlus,
    plus: Plus,
    plusCircle: PlusCircle,
    minusCircle: MinusCircle,
    bell: Bell,
    search: Search,
    user: User,
    lock: Lock,
    edit: Edit,
    delete: Trash2,
    info: Info,
    chevronRight: ChevronRight,
    chevronLeft: ChevronLeft,
    chevronDown: ChevronDown,
    chevronUp: ChevronUp,
    close: X,
    check: Check,
    alert: AlertTriangle,
    help: HelpCircle,
    menu: Menu,
    moon: Moon,
    sun: Sun,
    layout: Layout,
    pieChart: PieChart,
    logout: LogOut,
    billing: CreditCard,
    shield: Shield,
    shieldCheck: ShieldCheck,
    organization: Building2,
    lab: FlaskConical,
    premium: Sparkles,
    quick: Zap,
    filter: Filter,
    arrowRight: ArrowRight,
    refresh: RefreshCw,
    more: MoreVertical,
    calendar: Calendar,
    cloud: Cloud,
    download: Download,
    upload: Upload,
    view: Eye,
    viewOff: EyeOff,
    star: Star,
    users: Users,
    tuning: Settings2,
    clock: Clock,
    history: History,
    mail: Mail,
    phone: Phone,
    location: MapPin,
    external: ExternalLink,
    copy: Copy,
    smartphone: Smartphone,
    laptop: Laptop,
    trending: TrendingUp,
    calculator: Calculator,
    layers: Layers,
    timer: Timer,
    badge: Badge,
    inbox: Inbox,
    trophy: Trophy,
    circle: Circle,
    moreHorizontal: MoreHorizontal,
    success: CheckCircle2,
    barChart: BarChart3,
    pointer: MousePointer2,
    userPlus: UserPlus,
    target: Target,
    logBuilder: Layout,
    car: Car
  },
  [IconTheme.PHOSPHOR]: {
    dashboard: Phosphor.House,
    salesLog: Phosphor.ClipboardText,
    activity: Phosphor.ChartLine,
    analytics: Phosphor.TrendUp,
    goals: Phosphor.Target,
    reports: Phosphor.FileText,
    inventory: Phosphor.Archive,
    settings: Phosphor.Gear,
    feedback: Phosphor.ChatCircleDots,
    plus: Phosphor.Plus,
    plusCircle: Phosphor.PlusCircle,
    minusCircle: Phosphor.MinusCircle,
    bell: Phosphor.Bell,
    search: Phosphor.MagnifyingGlass,
    user: Phosphor.User,
    lock: Phosphor.Lock,
    edit: Phosphor.Pencil,
    delete: Phosphor.Trash,
    info: Phosphor.Info,
    chevronRight: Phosphor.CaretRight,
    chevronLeft: Phosphor.CaretLeft,
    chevronDown: Phosphor.CaretDown,
    chevronUp: Phosphor.CaretUp,
    close: Phosphor.X,
    check: Phosphor.Check,
    alert: Phosphor.Warning,
    help: Phosphor.Question,
    menu: Phosphor.List,
    moon: Phosphor.Moon,
    sun: Phosphor.Sun,
    layout: Phosphor.Layout,
    pieChart: Phosphor.ChartPie,
    logout: Phosphor.SignOut,
    billing: Phosphor.CreditCard,
    shield: Phosphor.Shield,
    shieldCheck: Phosphor.ShieldCheck,
    organization: Phosphor.Buildings,
    lab: Phosphor.Flask,
    premium: Phosphor.Sparkle,
    quick: Phosphor.Lightning,
    filter: Phosphor.Funnel,
    arrowRight: Phosphor.ArrowRight,
    refresh: Phosphor.ArrowCounterClockwise,
    more: Phosphor.DotsThreeVertical,
    calendar: Phosphor.Calendar,
    cloud: Phosphor.Cloud,
    download: Phosphor.Download,
    upload: Phosphor.Upload,
    view: Phosphor.Eye,
    viewOff: Phosphor.EyeSlash,
    star: Phosphor.Star,
    users: Phosphor.Users,
    tuning: Phosphor.Sliders,
    clock: Phosphor.Clock,
    history: Phosphor.ClockCounterClockwise,
    mail: Phosphor.Envelope,
    phone: Phosphor.Phone,
    location: Phosphor.MapPin,
    external: Phosphor.ArrowSquareOut,
    copy: Phosphor.Copy,
    smartphone: Phosphor.DeviceMobile,
    laptop: Phosphor.Laptop,
    trending: Phosphor.TrendUp,
    calculator: Phosphor.Calculator,
    layers: Phosphor.Stack,
    timer: Phosphor.Timer,
    badge: Phosphor.Medal,
    inbox: Phosphor.Tray,
    trophy: Phosphor.Trophy,
    circle: Phosphor.Circle,
    moreHorizontal: Phosphor.DotsThree,
    success: Phosphor.CheckCircle,
    barChart: Phosphor.ChartBar,
    pointer: Phosphor.CursorClick,
    userPlus: Phosphor.UserPlus,
    target: Phosphor.Target,
    car: Phosphor.Car
  },
  [IconTheme.TABLER]: {
    dashboard: Tabler.IconHome,
    salesLog: Tabler.IconClipboardText,
    activity: Tabler.IconActivity,
    analytics: Tabler.IconTrendingUp,
    goals: Tabler.IconTarget,
    reports: Tabler.IconFileText,
    inventory: Tabler.IconArchive,
    settings: Tabler.IconSettings,
    feedback: Tabler.IconMessagePlus,
    plus: Tabler.IconPlus,
    plusCircle: Tabler.IconCirclePlus,
    minusCircle: Tabler.IconCircleMinus,
    bell: Tabler.IconBell,
    search: Tabler.IconSearch,
    user: Tabler.IconUser,
    lock: Tabler.IconLock,
    edit: Tabler.IconEdit,
    delete: Tabler.IconTrash,
    info: Tabler.IconInfoCircle,
    chevronRight: Tabler.IconChevronRight,
    chevronLeft: Tabler.IconChevronLeft,
    chevronDown: Tabler.IconChevronDown,
    chevronUp: Tabler.IconChevronUp,
    close: Tabler.IconX,
    check: Tabler.IconCheck,
    alert: Tabler.IconAlertTriangle,
    help: Tabler.IconHelp,
    menu: Tabler.IconMenu2,
    moon: Tabler.IconMoon,
    sun: Tabler.IconSun,
    layout: Tabler.IconLayout,
    pieChart: Tabler.IconChartPie,
    logout: Tabler.IconLogout,
    billing: Tabler.IconCreditCard,
    shield: Tabler.IconShield,
    shieldCheck: Tabler.IconShieldCheck,
    organization: Tabler.IconBuildingSkyscraper,
    lab: Tabler.IconFlask,
    premium: Tabler.IconSparkles,
    quick: Tabler.IconBolt,
    filter: Tabler.IconFilter,
    arrowRight: Tabler.IconArrowRight,
    refresh: Tabler.IconRefresh,
    more: Tabler.IconDotsVertical,
    calendar: Tabler.IconCalendar,
    cloud: Tabler.IconCloud,
    download: Tabler.IconDownload,
    upload: Tabler.IconUpload,
    view: Tabler.IconEye,
    viewOff: Tabler.IconEyeOff,
    star: Tabler.IconStar,
    users: Tabler.IconUsers,
    tuning: Tabler.IconAdjustments,
    clock: Tabler.IconClock,
    history: Tabler.IconHistory,
    mail: Tabler.IconMail,
    phone: Tabler.IconPhone,
    location: Tabler.IconMapPin,
    external: Tabler.IconExternalLink,
    copy: Tabler.IconCopy,
    smartphone: Tabler.IconDeviceMobile,
    laptop: Tabler.IconDeviceLaptop,
    trending: Tabler.IconTrendingUp,
    calculator: Tabler.IconCalculator,
    layers: Tabler.IconStack,
    timer: Tabler.IconClock,
    badge: Tabler.IconId,
    inbox: Tabler.IconInbox,
    trophy: Tabler.IconTrophy,
    circle: Tabler.IconCircle,
    moreHorizontal: Tabler.IconDots,
    success: Tabler.IconCircleCheck,
    barChart: Tabler.IconChartBar,
    pointer: Tabler.IconPointer,
    userPlus: Tabler.IconUserPlus,
    target: Tabler.IconTarget,
    car: Tabler.IconCar
  },
  [IconTheme.HEROICONS]: {
    dashboard: HeroIcons.HomeIcon,
    salesLog: HeroIcons.ClipboardDocumentListIcon,
    activity: HeroIcons.BoltIcon,
    analytics: HeroIcons.ChartBarIcon,
    goals: HeroIcons.FlagIcon,
    reports: HeroIcons.DocumentTextIcon,
    inventory: HeroIcons.ArchiveBoxIcon,
    settings: HeroIcons.Cog6ToothIcon,
    feedback: HeroIcons.ChatBubbleBottomCenterIcon,
    plus: HeroIcons.PlusIcon,
    plusCircle: HeroIcons.PlusCircleIcon,
    minusCircle: HeroIcons.MinusCircleIcon,
    bell: HeroIcons.BellIcon,
    search: HeroIcons.MagnifyingGlassIcon,
    user: HeroIcons.UserIcon,
    lock: HeroIcons.LockClosedIcon,
    edit: HeroIcons.PencilIcon,
    delete: HeroIcons.TrashIcon,
    info: HeroIcons.InformationCircleIcon,
    chevronRight: HeroIcons.ChevronRightIcon,
    chevronLeft: HeroIcons.ChevronLeftIcon,
    chevronDown: HeroIcons.ChevronDownIcon,
    chevronUp: HeroIcons.ChevronUpIcon,
    close: HeroIcons.XMarkIcon,
    check: HeroIcons.CheckIcon,
    alert: HeroIcons.ExclamationTriangleIcon,
    help: HeroIcons.QuestionMarkCircleIcon,
    menu: HeroIcons.Bars3Icon,
    moon: HeroIcons.MoonIcon,
    sun: HeroIcons.SunIcon,
    layout: HeroIcons.ViewColumnsIcon,
    pieChart: HeroIcons.ChartPieIcon,
    logout: HeroIcons.ArrowLeftOnRectangleIcon,
    billing: HeroIcons.CreditCardIcon,
    shield: HeroIcons.ShieldExclamationIcon,
    shieldCheck: HeroIcons.ShieldCheckIcon,
    organization: HeroIcons.BuildingOffice2Icon,
    lab: HeroIcons.BeakerIcon,
    premium: HeroIcons.SparklesIcon,
    quick: HeroIcons.BoltIcon,
    filter: HeroIcons.FunnelIcon,
    arrowRight: HeroIcons.ArrowRightIcon,
    refresh: HeroIcons.ArrowPathIcon,
    more: HeroIcons.EllipsisVerticalIcon,
    calendar: HeroIcons.CalendarIcon,
    cloud: HeroIcons.CloudIcon,
    download: HeroIcons.ArrowDownTrayIcon,
    upload: HeroIcons.ArrowUpTrayIcon,
    view: HeroIcons.EyeIcon,
    viewOff: HeroIcons.EyeSlashIcon,
    star: HeroIcons.StarIcon,
    users: HeroIcons.UsersIcon,
    tuning: HeroIcons.AdjustmentsHorizontalIcon,
    clock: HeroIcons.ClockIcon,
    history: HeroIcons.ArrowUturnLeftIcon,
    mail: HeroIcons.EnvelopeIcon,
    phone: HeroIcons.PhoneIcon,
    location: HeroIcons.MapPinIcon,
    external: HeroIcons.ArrowTopRightOnSquareIcon,
    copy: HeroIcons.ClipboardIcon,
    smartphone: HeroIcons.DevicePhoneMobileIcon,
    laptop: HeroIcons.ComputerDesktopIcon,
    trending: HeroIcons.ArrowTrendingUpIcon,
    calculator: HeroIcons.CalculatorIcon,
    layers: HeroIcons.Square3Stack3DIcon,
    timer: HeroIcons.ClockIcon,
    badge: HeroIcons.TagIcon,
    inbox: HeroIcons.InboxIcon,
    trophy: HeroIcons.TrophyIcon,
    circle: HeroIcons.EllipsisHorizontalCircleIcon,
    moreHorizontal: HeroIcons.EllipsisHorizontalIcon,
    success: HeroIcons.CheckCircleIcon,
    barChart: HeroIcons.ChartBarIcon,
    pointer: HeroIcons.CursorArrowRaysIcon,
    userPlus: HeroIcons.UserPlusIcon,
    target: HeroIcons.SignalIcon,
    car: HeroIcons.TruckIcon
  }
};

export interface AppIconProps {
  /** The semantic name of the icon */
  name: IconName;
  /** Size in pixels (default: 20) */
  size?: number;
  /** Stroke width (default: 2) */
  strokeWidth?: number;
  /** Additional Tailwind classes */
  className?: string;
  /** Accessibility hide (default: true) */
  'aria-hidden'?: boolean;
}

/**
 * AppIcon - Centralized Icon Abstraction
 * 
 * Provides a semantic interface for icons across the app,
 * allowing for global icon pack theme switching.
 */
export const AppIcon: React.FC<AppIconProps> = ({ 
  name, 
  size = 20, 
  strokeWidth = 2, 
  className,
  'aria-hidden': ariaHidden = true 
}) => {
  const { profile } = useAuth();
  
  // Free tier is locked to Lucide
  const isFreeTier = profile?.subscriptionTier === SubscriptionTier.FREE;
  const currentTheme = isFreeTier ? IconTheme.LUCIDE : (profile?.preferences?.iconTheme || IconTheme.LUCIDE);

  // Attempt to get icon from the selected pack
  let IconComponent = themedRegistry[currentTheme]?.[name];

  // Fallback 1: selected pack but missing this icon? attempt Lucide
  if (!IconComponent && currentTheme !== IconTheme.LUCIDE) {
    IconComponent = themedRegistry[IconTheme.LUCIDE]?.[name];
  }

  // Fallback 2: Final fallback to HelpCircle from Lucide
  if (!IconComponent) {
    IconComponent = HelpCircle;
  }

  // Normalize props based on the active pack
  const getNormalizedProps = () => {
    switch (currentTheme) {
      case IconTheme.LUCIDE:
        return { size, strokeWidth };
      case IconTheme.PHOSPHOR:
        // Phosphor weight mapping
        let weight: any = 'regular';
        if (strokeWidth <= 1.2) weight = 'thin';
        else if (strokeWidth <= 1.6) weight = 'light';
        else if (strokeWidth > 2.5) weight = 'bold';
        return { size, weight };
      case IconTheme.TABLER:
        return { size, stroke: strokeWidth };
      case IconTheme.HEROICONS:
        // Heroicons don't use size/strokeWidth props natively in the same way
        // they respond best to width/height and style or className
        return { width: size, height: size, strokeWidth };
      default:
        return { size, strokeWidth };
    }
  };

  return (
    <IconComponent 
      {...getNormalizedProps()}
      className={className} 
      aria-hidden={ariaHidden}
    />
  );
};
