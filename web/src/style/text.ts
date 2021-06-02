import styled from 'styled-components/macro';

export const SmallText = styled.div`
    white-space: nowrap;
    font-size: .75rem;
    line-height: 1rem;
    color: ${({theme}) => theme.colors.textSecondary};
`;
