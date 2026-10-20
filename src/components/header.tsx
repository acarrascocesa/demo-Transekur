import { Brand } from "./brand";
import { Logout } from "./logout";
export function Header({ name, role }: { name: string; role: string }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <div className="header-account">
          <div className="account-text">
            <strong>{name}</strong>
            <span>{role}</span>
          </div>
          <Logout />
        </div>
      </div>
    </header>
  );
}
