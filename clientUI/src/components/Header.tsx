import React from 'react';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  background-color: var(--primary-color);
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  
  span {
    margin-left: 10px;
  }
`;

const Nav = styled.nav`
  ul {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  
  li {
    margin-left: 20px;
  }
  
  a {
    color: white;
    text-decoration: none;
    font-weight: 500;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  
  span {
    margin-right: 10px;
  }
  
  button {
    background: transparent;
    border: 1px solid white;
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }
`;

interface HeaderProps {
  userName?: string;
}

const Header: React.FC<HeaderProps> = ({ userName = 'John Doe' }) => {
  return (
    <HeaderContainer>
      <HeaderContent>
        <Logo>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
            <path d="M2 17L12 22L22 17V7L12 12L2 7V17Z" fill="white" opacity="0.6" />
          </svg>
          <span>TurboTax</span>
        </Logo>
        
        <Nav>
          <ul>
            <li><a href="#">Home</a></li>
            <li><a href="#">Tax Returns</a></li>
            <li><a href="#">Refund Status</a></li>
            <li><a href="#">Help</a></li>
          </ul>
        </Nav>
        
        <UserInfo>
          <span>Welcome, {userName}</span>
          <button>Sign Out</button>
        </UserInfo>
      </HeaderContent>
    </HeaderContainer>
  );
};

export default Header;