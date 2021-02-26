import styled from 'styled-components/macro';

export const SmallText = styled.div`
    white-space: nowrap;
    font-size: .6rem;
    line-height: 1rem;
    filter: brightness(70%);
    color: ${({theme}) => theme.colors.gray1};
`;
