import { Heart, Home, MessageCircle, Search, UserIcon, Users } from 'lucide-react'
import bgImage from './bgImage.webp'
import group_users from './group_users.webp'
import sponsored_img from './sponsored_img.webp'
import link_tab_icon from "./link_tab_icon.webp";
import link_tab_icon_removebg from "./link_tab_icon-removebg.webp"
import link_navbar_logo from "./link_navbar_logo.webp"
import link_navbar_logo_removebg from "./link_navbar_logo-removebg.webp"
import link_main_logo from "./link_main_logo.webp"
import link_main_logo_remove_bg from "./link_main_logo-removebg.webp"

export const assets = {
    bgImage,
    group_users,
    sponsored_img,
    link_tab_icon,
    link_tab_icon_removebg,
    link_navbar_logo,
    link_navbar_logo_removebg,
    link_main_logo,
    link_main_logo_remove_bg,
}

export const menuItemsData = [
    { to: '/', label: 'Feed', Icon: Home },
    { to: '/notifications', label: 'Notifications', Icon: Heart },
    { to: '/messages', label: 'Messages', Icon: MessageCircle },
    { to: '/connections', label: 'Connections', Icon: Users },
    { to: '/discover', label: 'Discover', Icon: Search },
    { to: '/profile', label: 'Profile', Icon: UserIcon },
];